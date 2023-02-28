import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(0, 0, 5);

    const controls = new kokomi.OrbitControls(this);
    controls.controls.autoRotate = true;

    kokomi.beautifyRender(this.renderer);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.background = new THREE.Color("#ffffff");

    const am = new kokomi.AssetManager(
      this,
      [
        {
          name: "hdr",
          type: "hdrTexture",
          path: "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/hdris/potsdamer-platz/potsdamer_platz_1k.hdr",
        },
        {
          name: "model",
          type: "gltfModel",
          path: "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/suzanne-high-poly/model.gltf",
        },
        {
          name: "matcap",
          type: "texture",
          path: "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/materials/wax-red/wax_red.jpghttps://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/materials/scfi-plastic/matcap_scifi_plastic.jpg",
        },
      ],
      {
        useDracoLoader: true,
      }
    );

    am.on("ready", () => {
      document.querySelector(".loader-screen").classList.add("hollow");

      const envMap = kokomi.getEnvmapFromHDRTexture(
        this.renderer,
        am.items["hdr"]
      );

      this.scene.environment = envMap;

      const stage = new kokomi.Stage(this);
      stage.addExisting();

      const model = am.items["model"];

      const modelParts = kokomi.flatModel(model.scene);
      kokomi.printModel(modelParts);

      stage.add(model.scene);

      const Suzanne = modelParts[1];

      Suzanne.castShadow = true;
      Suzanne.receiveShadow = true;

      const matcap = am.items["matcap"];
      matcap.encoding = THREE.sRGBEncoding;
      matcap.needsUpdate = true;
      Suzanne.material = new THREE.MeshMatcapMaterial({
        matcap,
      });
    });
  }
}
