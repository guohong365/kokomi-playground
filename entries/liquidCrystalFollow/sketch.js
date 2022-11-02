import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";

const resourceList = [
  {
    name: "cubemap",
    type: "cubeTexture",
    path: [
      "https://s2.loli.net/2022/11/02/AdySfoqhV8W5Fgr.png",
      "https://s2.loli.net/2022/11/02/raZmYvN5kC8gVdu.png",
      "https://s2.loli.net/2022/11/02/jhUc8kHMIxBwKSR.png",
      "https://s2.loli.net/2022/11/02/Dk6grUanARNLpOM.png",
      "https://s2.loli.net/2022/11/02/CwBdbtuMoQmKcjq.png",
      "https://s2.loli.net/2022/11/02/SrZMC3bDAd7xJwj.png",
    ],
  },
];

class Sketch extends kokomi.Base {
  create() {
    const am = new kokomi.AssetManager(this, resourceList);
    am.emitter.on("ready", () => {
      this.camera.position.set(0, 0, 1);

      new kokomi.OrbitControls(this);

      const params = {
        uSize: 0.28,
        uDistortionFrequency: 2.2,
        uDistortionStrength: 1.6,
        uDistortionSpeed: 0.5,
        uDisplacementFrequency: 0.2,
        uDisplacementScale: 0.7,
        uDisplacementStrength: 0.1,
        uFresnelOffset: -1.4,
        uFresnelMultiplier: 1.44,
        uFresnelPower: 1.24,
        uMiddleFresnelOpacity: 0.1,
        uRefraction: 0.03,
        uRefractionColorShift: 0.8,
        GLOW: 0.005,
        mouse1Lerp: 0.1,
        mouse2Lerp: 0.09,
      };

      const screenQuad = new kokomi.ScreenQuad(this, {
        shadertoyMode: true,
        fragmentShader,
        uniforms: {
          uMouse1: {
            value: new THREE.Vector2(0, 0),
          },
          uMouse2: {
            value: new THREE.Vector2(0, 0),
          },
          uSize: {
            value: params.uSize,
          },
          uAspect: {
            value: new THREE.Vector2(1, 1),
          },
          uDistortionFrequency: {
            value: params.uDistortionFrequency,
          },
          uDistortionStrength: {
            value: params.uDistortionStrength,
          },
          uDistortionSpeed: {
            value: params.uDistortionSpeed,
          },
          uDisplacementFrequency: {
            value: params.uDisplacementFrequency,
          },
          uDisplacementScale: {
            value: params.uDisplacementScale,
          },
          uDisplacementStrength: {
            value: params.uDisplacementStrength,
          },
          uFresnelOffset: {
            value: params.uFresnelOffset,
          },
          uFresnelMultiplier: {
            value: params.uFresnelMultiplier,
          },
          uFresnelPower: {
            value: params.uFresnelPower,
          },
          tMap: {
            value: null,
          },
          uMiddleFresnelOpacity: {
            value: params.uMiddleFresnelOpacity,
          },
          uRefraction: {
            value: params.uRefraction,
          },
          uRefractionColorShift: {
            value: params.uRefractionColorShift,
          },
          tRender: {
            value: null,
          },
          tRenderHover: {
            value: null,
          },
          uRenderHoverOpacity: {
            value: 0,
          },
        },
      });
      screenQuad.material.transparent = true;
      screenQuad.material.defines = {
        GLOW: params.GLOW,
      };
      screenQuad.addExisting();

      // this.scene.background = am.items["cubemap"];

      screenQuad.material.uniforms.tMap.value = am.items["cubemap"];

      let offsetX1 = 0;
      let offsetY1 = 0;

      let offsetX2 = 0;
      let offsetY2 = 0;

      this.update(() => {
        // mouse
        const mouse = new THREE.Vector2(
          this.iMouse.mouseScreen.x / window.innerWidth,
          this.iMouse.mouseScreen.y / window.innerHeight
        );

        const mouse1Lerp = params.mouse1Lerp;
        const mouse2Lerp = params.mouse2Lerp;

        offsetX1 = THREE.MathUtils.lerp(offsetX1, mouse.x, mouse1Lerp);
        offsetY1 = THREE.MathUtils.lerp(offsetY1, mouse.y, mouse1Lerp);

        offsetX2 = THREE.MathUtils.lerp(offsetX2, offsetX1, mouse2Lerp);
        offsetY2 = THREE.MathUtils.lerp(offsetY2, offsetY1, mouse2Lerp);

        screenQuad.material.uniforms.uMouse1.value = new THREE.Vector2(
          offsetX1,
          offsetY1
        );
        screenQuad.material.uniforms.uMouse2.value = new THREE.Vector2(
          offsetX2,
          offsetY2
        );

        // aspect
        if (window.innerHeight / window.innerWidth > 1) {
          screenQuad.material.uniforms.uAspect.value = new THREE.Vector2(
            window.innerWidth / window.innerHeight,
            1
          );
        } else {
          screenQuad.material.uniforms.uAspect.value = new THREE.Vector2(
            1,
            window.innerHeight / window.innerWidth
          );
        }
      });
    });
  }
}
