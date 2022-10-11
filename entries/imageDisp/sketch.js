import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";

class Sketch extends kokomi.Base {
  async create() {
    const screenCamera = new kokomi.ScreenCamera(this);
    screenCamera.addExisting();

    const tex1 = new THREE.TextureLoader().load(
      "https://s2.loli.net/2022/09/08/gGY4VloDAeUwWxt.jpg"
    );
    tex1.magFilter = THREE.LinearFilter;
    tex1.minFilter = THREE.LinearFilter;

    const tex2 = new THREE.TextureLoader().load(
      "https://s2.loli.net/2022/09/08/wSYFN2izrMLulxh.jpg"
    );
    tex2.magFilter = THREE.LinearFilter;
    tex2.minFilter = THREE.LinearFilter;

    const dispTex = new THREE.TextureLoader().load(
      "https://s2.loli.net/2022/10/11/Q4xOSK3JglPnZ7W.jpg"
    );
    dispTex.wrapS = THREE.RepeatWrapping;
    dispTex.wrapT = THREE.RepeatWrapping;

    const gallary = new kokomi.Gallery(this, {
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture1: {
          value: tex1,
        },
        uTexture2: {
          value: tex2,
        },
        uDisp: {
          value: dispTex,
        },
        uProgress: {
          value: 0,
        },
        uIntensity: {
          value: -0.65,
        },
      },
    });
    await gallary.addExisting();

    const doTransition = (mesh) => {
      gsap.to(mesh.material.uniforms.uProgress, {
        value: 1,
        duration: 1.2,
        ease: "expo.out",
      });
    };

    const undoTransition = (mesh) => {
      gsap.to(mesh.material.uniforms.uProgress, {
        value: 0,
        duration: 1.2,
        ease: "expo.out",
      });
    };

    gallary.makuGroup.makus.forEach((maku) => {
      this.interactionManager.add(maku.mesh);

      maku.mesh.addEventListener("mouseover", () => {
        doTransition(maku.mesh);
      });
      maku.mesh.addEventListener("mouseout", () => {
        undoTransition(maku.mesh);
      });
    });
  }
}
