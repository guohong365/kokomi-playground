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
        {
          name: "aoMap",
          type: "texture",
          path: "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/materials/wood-floor-43/WoodFloor043_1K_AmbientOcclusion.jpg",
        },
        {
          name: "map",
          type: "texture",
          path: "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/materials/wood-floor-43/WoodFloor043_1K_Color.jpg",
        },
        {
          name: "displacementMap",
          type: "texture",
          path: "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/materials/wood-floor-43/WoodFloor043_1K_Displacement.jpg",
        },
        {
          name: "metalnessMap",
          type: "texture",
          path: "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/materials/wood-floor-43/WoodFloor043_1K_Metalness.jpg",
        },
        {
          name: "normalMap",
          type: "texture",
          path: "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/materials/wood-floor-43/WoodFloor043_1K_Normal.jpg",
        },
        {
          name: "roughnessMap",
          type: "texture",
          path: "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/materials/wood-floor-43/WoodFloor043_1K_Roughness.jpg",
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

      const aoMap = am.items["aoMap"];
      const map = am.items["map"];
      const displacementMap = am.items["displacementMap"];
      const metalnessMap = am.items["metalnessMap"];
      const normalMap = am.items["normalMap"];
      const roughnessMap = am.items["roughnessMap"];

      const model = new THREE.Mesh(
        new THREE.SphereGeometry(1, 200, 200),
        new THREE.MeshPhysicalMaterial({
          aoMap,
          map,
          displacementMap,
          normalMap,
          roughnessMap,
          displacementScale: 0.1,
        })
      );

      stage.add(model);
    });
  }
}
