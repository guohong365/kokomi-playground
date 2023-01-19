import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

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
    am.on("ready", () => {
      this.camera.position.set(0, 0, 2);

      new kokomi.OrbitControls(this);

      const params = {
        size: 0.28,
        glow: 0.005,
        mouse1Lerp: 0.1,
        mouse2Lerp: 0.09,
      };

      const sq = new kokomi.ScreenQuad(this, {
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
            value: params.size,
          },
          uAspect: {
            value: new THREE.Vector2(1, 1),
          },
          uCubemap: {
            value: null,
          },
        },
      });
      sq.material.transparent = true;
      sq.material.defines = {
        GLOW: params.glow,
      };
      sq.addExisting();

      // this.scene.background = am.items["cubemap"];

      sq.material.uniforms.uCubemap.value = am.items["cubemap"];

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

        sq.material.uniforms.uMouse1.value = new THREE.Vector2(
          offsetX1,
          offsetY1
        );
        sq.material.uniforms.uMouse2.value = new THREE.Vector2(
          offsetX2,
          offsetY2
        );

        // aspect
        if (window.innerHeight / window.innerWidth > 1) {
          sq.material.uniforms.uAspect.value = new THREE.Vector2(
            window.innerWidth / window.innerHeight,
            1
          );
        } else {
          sq.material.uniforms.uAspect.value = new THREE.Vector2(
            1,
            window.innerHeight / window.innerWidth
          );
        }
      });
    });
  }
}
