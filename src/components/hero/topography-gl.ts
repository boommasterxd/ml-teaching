import { FIELD_FRAGMENT, GLASS_FRAGMENT, SCREEN_VERTEX, VERTEX } from './topography-shaders';

export type GlassShape = 'ring' | 'digits';

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function queueProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.deleteProgram(program);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  // Attached shaders stay alive until detach after linking or disposal of a pending program.
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  const releaseShaders = () => {
    gl.detachShader(program, vertex);
    gl.detachShader(program, fragment);
  };
  return { program, releaseShaders };
}

export function queueGlassPrograms(gl: WebGLRenderingContext, shape: GlassShape) {
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  // Reserve one vector per other field uniform, even on minimum-spec WebGL 1 devices.
  const freeVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) - 8;
  const rippleCapacity = Math.min(32, Math.max(4, freeVectors));
  const limits = `#define RIPPLE_CAPACITY ${rippleCapacity}\n`;
  const field =
    shape === 'digits'
      ? queueProgram(gl, SCREEN_VERTEX, limits + '#define GLASS_DIGITS\n' + FIELD_FRAGMENT)
      : queueProgram(gl, limits + VERTEX, limits + FIELD_FRAGMENT);
  if (!field) return null;
  const glass = queueProgram(gl, SCREEN_VERTEX, GLASS_FRAGMENT);
  if (!glass) {
    gl.deleteProgram(field.program);
    return null;
  }
  const programs = [field.program, glass.program];
  const dispose = () => programs.forEach((program) => gl.deleteProgram(program));
  const poll = () => {
    if (
      parallel &&
      programs.some((p) => !gl.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR))
    )
      return 'pending' as const;
    const linked = programs.every((program) => gl.getProgramParameter(program, gl.LINK_STATUS));
    field.releaseShaders();
    glass.releaseShaders();
    return linked;
  };
  return { field: field.program, glass: glass.program, rippleCapacity, poll, dispose };
}

export function rasterLimit(gl: WebGLRenderingContext) {
  const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array | null;
  const candidates = [
    gl.getParameter(gl.MAX_TEXTURE_SIZE),
    gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    ...(viewport ?? []),
  ];
  return Math.min(8192, ...candidates.filter((value) => Number.isFinite(value) && value > 0));
}

export function configureTexture(gl: WebGLRenderingContext, texture: WebGLTexture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
