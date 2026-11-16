import { describe, expect, it, vi } from 'vitest';
import { createTopographyRenderer } from '@/components/hero/topography-renderer';

function gpu() {
  const gl = {
    MAX_TEXTURE_SIZE: 3379,
    MAX_RENDERBUFFER_SIZE: 34024,
    MAX_VIEWPORT_DIMS: 3386,
    FRAMEBUFFER_COMPLETE: 36053,
    getParameter: vi.fn((name: number): number | Int32Array =>
      name === 3386 ? new Int32Array([16384, 16384]) : 16384,
    ),
    disable: vi.fn(),
    bindAttribLocation: vi.fn(),
    createFramebuffer: vi.fn((): object | null => ({})),
    deleteFramebuffer: vi.fn(),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    checkFramebufferStatus: vi.fn(() => 36053),
    getExtension: vi.fn(() => ({})),
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    detachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    deleteProgram: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    createTexture: vi.fn(() => ({})),
    deleteBuffer: vi.fn(),
    deleteTexture: vi.fn(),
    useProgram: vi.fn(),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    bindTexture: vi.fn(),
    pixelStorei: vi.fn(),
    texImage2D: vi.fn<WebGLRenderingContext['texImage2D']>(),
    texParameteri: vi.fn(),
    getUniformLocation: vi.fn(() => null),
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniform4fv: vi.fn(),
    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    drawArrays: vi.fn(),
    isContextLost: vi.fn(() => false),
  };
  const canvas = { getContext: vi.fn(() => gl) } as unknown as HTMLCanvasElement;
  return { canvas, gl };
}

const frame = {
  width: 3840,
  height: 2160,
  dpr: 1,
  time: 10,
  lift: 1,
  hill: [300, 200] as [number, number],
  ripples: new Float32Array(16),
  color: [1, 0, 0] as [number, number, number],
};

describe('optional contour GPU resources', () => {
  it('releases shaders after linking, disposes every retained allocation once and prevents later draws', () => {
    const { canvas, gl } = gpu();
    const renderer = createTopographyRenderer(canvas)!;
    expect(gl.deleteShader).toHaveBeenCalledTimes(4);
    const frame = {
      width: 720,
      height: 620,
      dpr: 2,
      time: 0,
      lift: 0,
      hill: [0, 0] as [number, number],
      ripples: new Float32Array(16),
      color: [1, 0, 0] as [number, number, number],
    };
    renderer.draw(frame);
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
    renderer.dispose();
    renderer.dispose();
    renderer.draw(frame);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteTexture).toHaveBeenCalledTimes(2);
    expect(gl.deleteFramebuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(2);
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  });

  it('fails back to the static scene and releases partial allocations when shader linking fails', () => {
    const { canvas, gl } = gpu();
    gl.getProgramParameter.mockReturnValue(false);
    expect(createTopographyRenderer(canvas)).toBeNull();
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.createBuffer).not.toHaveBeenCalled();
  });

  it('uses a bounded scalar pass and sharp output while reusing allocations and lookups', () => {
    const { canvas, gl } = gpu();
    const renderer = createTopographyRenderer(canvas)!;
    const lookups = gl.getUniformLocation.mock.calls.length;
    expect(renderer.draw(frame)).toBe(true);
    expect(gl.viewport.mock.calls).toEqual([
      [0, 0, 960, 540],
      [0, 0, 3840, 2160],
    ]);
    expect(gl.texImage2D).toHaveBeenCalledTimes(2);
    renderer.draw({ ...frame, time: 20 });
    expect(gl.texImage2D).toHaveBeenCalledTimes(2);
    expect(gl.getUniformLocation).toHaveBeenCalledTimes(lookups);
    renderer.draw({ ...frame, width: 7680 });
    const [, , , width, height] = gl.texImage2D.mock.calls.at(-1)!;
    expect(Number(width) * Number(height)).toBeLessThanOrEqual(600_000);
    expect(gl.createTexture).toHaveBeenCalledTimes(2);
    renderer.dispose();
  });

  it('restores the default framebuffer on failure and retries an incomplete resized field', () => {
    const { canvas, gl } = gpu();
    const renderer = createTopographyRenderer(canvas)!;
    gl.checkFramebufferStatus.mockReturnValueOnce(0);
    expect(renderer.draw(frame)).toBe(false);
    expect(gl.drawArrays).not.toHaveBeenCalled();
    expect(gl.bindFramebuffer).toHaveBeenLastCalledWith(undefined, null);
    expect(renderer.draw(frame)).toBe(true);
    expect(gl.texImage2D).toHaveBeenCalledTimes(3);
    gl.isContextLost.mockReturnValue(true);
    expect(renderer.draw(frame)).toBe(false);
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
    renderer.dispose();
  });

  it('exposes the smallest GPU raster limit and rejects oversized output', () => {
    const { canvas, gl } = gpu();
    gl.getParameter.mockImplementation((name) =>
      name === 3386 ? new Int32Array([4096, 2048]) : 8192,
    );
    const renderer = createTopographyRenderer(canvas)!;
    expect(renderer.maxRasterDimension).toBe(2048);
    expect(renderer.draw(frame)).toBe(false);
    expect(gl.texImage2D).toHaveBeenCalledTimes(1);
    renderer.dispose();
  });

  it('releases partial framebuffer allocations and stops before any field draw', () => {
    const { canvas, gl } = gpu();
    gl.createFramebuffer.mockReturnValueOnce(null);
    expect(createTopographyRenderer(canvas)).toBeNull();
    expect(gl.deleteTexture).toHaveBeenCalledTimes(2);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(2);
    expect(gl.drawArrays).not.toHaveBeenCalled();
    expect(gl.bindFramebuffer).toHaveBeenLastCalledWith(undefined, null);
  });

  it('cleans up the first program when the second program cannot link', () => {
    const { canvas, gl } = gpu();
    gl.getProgramParameter.mockReturnValueOnce(true).mockReturnValueOnce(false);
    expect(createTopographyRenderer(canvas)).toBeNull();
    expect(gl.deleteProgram).toHaveBeenCalledTimes(2);
    expect(gl.createBuffer).not.toHaveBeenCalled();
  });
});
