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

    kokomi.enableShadow(this.renderer);

    this.scene.background = new THREE.Color("#ffffff");

    const am = new kokomi.AssetManager(
      this,
      [
        {
          name: "hdr",
          type: "hdrTexture",
          path: "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/hdris/potsdamer-platz/potsdamer_platz_1k.hdr",
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

      this.scene.background = envMap;

      const model = new THREE.Mesh(
        new THREE.SphereGeometry(2, 128, 32),
        new THREE.MeshStandardMaterial({
          metalness: 1,
          roughness: 0,
        })
      );
      this.scene.add(model);
    });
  }
}
