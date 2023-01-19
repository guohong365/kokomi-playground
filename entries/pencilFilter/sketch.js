import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(0, 1, 1.5);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    new kokomi.OrbitControls(this);

    const cm = new kokomi.CustomMesh(this, {
      geometry: new THREE.TorusKnotGeometry(0.25, 0.1),
      baseMaterial: new THREE.MeshStandardMaterial(),
      materialParams: {
        side: THREE.DoubleSide,
      },
    });
    cm.mesh.position.y = 0.45;
    cm.mesh.castShadow = true;
    cm.addExisting();

    const cm2 = new kokomi.CustomMesh(this, {
      geometry: new THREE.PlaneGeometry(3, 3, 16, 16),
      baseMaterial: new THREE.MeshStandardMaterial(),
      materialParams: {
        side: THREE.DoubleSide,
      },
    });
    cm2.mesh.rotation.x = -Math.PI / 2;
    cm2.mesh.receiveShadow = true;
    cm2.addExisting();

    const ambiLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(2, 2, 2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    // postprocessing
    const tex = new THREE.TextureLoader().load(
      "https://s2.loli.net/2022/12/04/lNdGHYIazT4mfcC.png"
    );
    const ce = new kokomi.CustomEffect(this, {
      vertexShader,
      fragmentShader,
      uniforms: {
        tNormals: {
          value: null,
        },
        uTexture: {
          value: tex,
        },
        uPencilColor: {
          value: new THREE.Color("#521F33"),
        },
        uBgColor: {
          value: new THREE.Color("#ffffff"),
        },
      },
    });
    ce.addExisting();

    const rtScene = this.scene;
    const rtCamera = this.camera;
    const normalFBO = new kokomi.FBO(this);
    normalFBO.rt.texture.type = THREE.HalfFloatType;
    normalFBO.rt.texture.minFilter = THREE.NearestFilter;
    normalFBO.rt.texture.magFilter = THREE.NearestFilter;

    this.update(() => {
      this.renderer.setRenderTarget(normalFBO.rt);

      const om = this.scene.overrideMaterial;
      this.scene.overrideMaterial = new THREE.MeshNormalMaterial();
      this.renderer.render(rtScene, rtCamera);
      this.scene.overrideMaterial = om;

      ce.customPass.material.uniforms.tNormals.value = normalFBO.rt.texture;

      this.renderer.setRenderTarget(null);
    });
  }
}
