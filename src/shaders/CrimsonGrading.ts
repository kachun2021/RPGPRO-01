import { Scene } from "@babylonjs/core/scene";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

const CRIMSON_FRAGMENT = `
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D textureSampler;
  uniform float intensity;
  uniform float time;

  vec3 crimsonGrade(vec3 color) {
    // Subtle red tint, slightly suppress green
    color.r = color.r * 1.1 + 0.02;
    color.g = color.g * 0.85;
    color.b = color.b * 0.9 + 0.01;

    // Mild contrast boost
    color = (color - 0.5) * 1.08 + 0.5;

    // Warm shadow tint
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 shadowTint = vec3(0.06, 0.01, 0.02);
    color = mix(color, color + shadowTint, (1.0 - luminance) * 0.3);

    return color;
  }

  vec3 vignette(vec3 color, vec2 uv) {
    float dist = distance(uv, vec2(0.5));
    float vig = smoothstep(0.85, 0.4, dist);
    // Light crimson vignette — don't crush blacks
    vec3 vigColor = mix(vec3(0.04, 0.005, 0.015), color, vig);
    return vigColor;
  }

  void main(void) {
    vec4 baseColor = texture2D(textureSampler, vUV);
    vec3 color = baseColor.rgb;

    // Apply crimson color grading
    vec3 graded = crimsonGrade(color);
    color = mix(color, graded, intensity);

    // Apply vignette
    color = vignette(color, vUV);

    // Subtle pulsing (blood moon heartbeat)
    float pulse = sin(time * 1.5) * 0.015 + 1.0;
    color *= pulse;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), baseColor.a);
  }
`;

export class CrimsonGrading {
     private static postProcess: PostProcess | null = null;
     private static startTime: number = Date.now();

     public static apply(scene: Scene, camera: Camera, intensity: number = 0.45): void {
          // Register the shader
          Effect.ShadersStore["crimsonGradingFragmentShader"] = CRIMSON_FRAGMENT;

          CrimsonGrading.startTime = Date.now();

          CrimsonGrading.postProcess = new PostProcess(
               "crimsonGrading",
               "crimsonGrading",
               ["intensity", "time"],   // uniforms
               null,                     // samplers
               1.0,                     // ratio
               camera,
               Texture.BILINEAR_SAMPLINGMODE,
               scene.getEngine()
          );

          CrimsonGrading.postProcess.onApply = (effect) => {
               effect.setFloat("intensity", intensity);
               effect.setFloat("time", (Date.now() - CrimsonGrading.startTime) / 1000);
          };
     }

     public static setIntensity(value: number): void {
          if (CrimsonGrading.postProcess) {
               CrimsonGrading.postProcess.onApply = (effect) => {
                    effect.setFloat("intensity", value);
                    effect.setFloat("time", (Date.now() - CrimsonGrading.startTime) / 1000);
               };
          }
     }
}
