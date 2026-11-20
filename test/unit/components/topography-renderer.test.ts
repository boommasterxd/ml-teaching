import { describe, expect, it, vi } from 'vitest';
import { createTopographyRenderer } from '@/components/hero/topography-renderer';

function gpu() {
  const gl = {
    MAX_TEXTURE_SIZE: 3379,
    MAX_RENDERBUFFER_SIZE: 34024,
    MAX_VIEWPORT_DIMS: 3386,
    FRAMEBUFFER_COMPLETE: 36053,
    LINK_STATUS: 0x8b82,
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
    getExtension: vi.fn((name: string): object | null =>
      name === 'OES_standard_derivatives' ? {} : null,
    ),
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    detachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn<(program: object, name: number) => boolean>().mockReturnValue(true),
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
    texImage2D: vi.fn<WebGLRenderingContext['texImage2D']>(),
    texParameteri: vi.fn(),
    getUniformLocation: vi.fn(() => null),
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
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
  fieldScale: 1,
  fieldTexels: 600_000,
  time: 10,
  lift: 1,
  hill: [300, 200] as [number, number],
  ripples: new Float32Array(16),
};

describe('optional glass GPU resources', () => {
  it('releases shaders after linking, disposes every retained allocation once and prevents later draws', () => {
    const { canvas, gl } = gpu();
    const renderer = createTopographyRenderer(canvas)!;
    expect(gl.deleteShader).toHaveBeenCalledTimes(4);
    const frame = {
      width: 720,
      height: 620,
      dpr: 2,
      fieldScale: 1.35,
      fieldTexels: 300_000,
      time: 0,
      lift: 0,
      hill: [0, 0] as [number, number],
      ripples: new Float32Array(16),
    };
    renderer.draw(frame);
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
    renderer.dispose();
    renderer.dispose();
    renderer.draw(frame);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteTexture).toHaveBeenCalledTimes(1);
    expect(gl.deleteFramebuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(2);
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  });

  it('waits for both asynchronous links before querying uniforms or drawing', () => {
    const { canvas, gl } = gpu();
    const completion = 0x91b1;
    gl.getExtension.mockImplementation((name) =>
      name === 'KHR_parallel_shader_compile' ? { COMPLETION_STATUS_KHR: completion } : {},
    );
    const renderer = createTopographyRenderer(canvas)!;
    expect(gl.linkProgram).toHaveBeenCalledTimes(2);
    const output = gl.createProgram.mock.results[1]!.value;
    gl.getProgramParameter.mockImplementation((program) => program !== output);
    expect(renderer.draw(frame)).toBe('pending');
    expect(gl.getProgramParameter.mock.calls.map(([, name]) => name)).toEqual([
      completion,
      completion,
    ]);
    expect(gl.getShaderParameter).not.toHaveBeenCalled();
    expect(gl.getUniformLocation).not.toHaveBeenCalled();
    expect(gl.useProgram).not.toHaveBeenCalled();
    expect(gl.drawArrays).not.toHaveBeenCalled();
    gl.getProgramParameter.mockReturnValue(true);
    expect(renderer.draw(frame)).toBe(true);
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
    const polls = gl.getProgramParameter.mock.calls.length;
    expect(renderer.draw(frame)).toBe(true);
    expect(gl.getProgramParameter).toHaveBeenCalledTimes(polls);
    renderer.dispose();
  });

  it('uses a bounded optics pass and sharp output while reusing allocations and lookups', () => {
    const { canvas, gl } = gpu();
    const renderer = createTopographyRenderer(canvas)!;
    expect(renderer.draw(frame)).toBe(true);
    const lookups = gl.getUniformLocation.mock.calls.length;
    expect(gl.viewport.mock.calls).toEqual([
      [0, 0, 960, 540],
      [0, 0, 3840, 2160],
    ]);
    expect(gl.texImage2D).toHaveBeenCalledTimes(1);
    renderer.draw({ ...frame, time: 20 });
    expect(gl.texImage2D).toHaveBeenCalledTimes(1);
    expect(gl.getUniformLocation).toHaveBeenCalledTimes(lookups);
    for (const [fieldScale, fieldTexels] of [
      [0.65, 40_000],
      [1.7, 600_000],
    ] as const) {
      renderer.draw({ ...frame, width: 7680, fieldScale, fieldTexels });
      const [, , , width, height] = gl.texImage2D.mock.calls.at(-1)!;
      expect(Number(width) * Number(height)).toBeLessThanOrEqual(fieldTexels);
    }
    expect(gl.createTexture).toHaveBeenCalledTimes(1);
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
    expect(gl.texImage2D).toHaveBeenCalledTimes(2);
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
    expect(gl.texImage2D).not.toHaveBeenCalled();
    renderer.dispose();
  });

  it('releases partial framebuffer allocations and stops before any field draw', () => {
    const { canvas, gl } = gpu();
    gl.createFramebuffer.mockReturnValueOnce(null);
    expect(createTopographyRenderer(canvas)).toBeNull();
    expect(gl.deleteTexture).toHaveBeenCalledTimes(1);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(2);
    expect(gl.drawArrays).not.toHaveBeenCalled();
    expect(gl.bindFramebuffer).toHaveBeenLastCalledWith(undefined, null);
  });

  it('releases both programs and keeps the static scene if one shader cannot link', () => {
    const { canvas, gl } = gpu();
    gl.getProgramParameter.mockReturnValueOnce(true).mockReturnValueOnce(false);
    const renderer = createTopographyRenderer(canvas)!;
    expect(renderer.draw(frame)).toBe(false);
    renderer.dispose();
    expect(gl.deleteProgram).toHaveBeenCalledTimes(2);
    expect(gl.useProgram).not.toHaveBeenCalled();
    expect(gl.getUniformLocation).not.toHaveBeenCalled();
  });
});
