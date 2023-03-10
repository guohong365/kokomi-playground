import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";
import { ThreeMFLoader } from "three-stdlib";

class Sketch extends kokomi.Base {
  create() {
    const globalConfig = {
      color: "#222222",
      decal: "decal-kessoku",
      isPickEnabled: false,
      shadow: true,
    };

    this.camera.position.set(0, 0, 7);

    const controls = new kokomi.OrbitControls(this);
    // controls.controls.autoRotate = true;

    kokomi.beautifyRender(this.renderer);

    if (globalConfig.shadow) {
      kokomi.enableShadow(this.renderer);

      this.renderer.shadowMap.type = THREE.VSMShadowMap;
    }

    this.scene.background = new THREE.Color("#ffffff");

    // model: https://sketchfab.com/3d-models/standard-t-shirt-1815c01895bd4538bc0bd05c3394698d
    // logo: https://www.reddit.com/r/BocchiTheRock/comments/z6n9pp/kessoku_band_logo_for_download/
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
          path: "../../assets/standard_t-shirt-transformed.glb",
        },
        {
          name: "decal-kessoku",
          type: "texture",
          path: "https://s2.loli.net/2023/03/10/PGJAbOKychReqtm.png",
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

      const stage = new kokomi.Stage(this, {
        shadow: false,
      });
      stage.addExisting();

      const model = am.items["model"];

      const modelParts = kokomi.flatModel(model.scene);
      kokomi.printModel(modelParts);

      const Object_16 = modelParts[15];

      const shirt = Object_16;

      shirt.scale.setScalar(0.01);

      shirt.rotation.set(-Math.PI / 2, 0, 0);

      shirt.castShadow = true;

      stage.add(shirt);

      // color
      shirt.material.color.copy(new THREE.Color(globalConfig.color));

      // decal
      const addDecal = (config = {}) => {
        const {
          parent,
          map,
          position = new THREE.Vector3(0, 0, 0),
          rotation = new THREE.Euler(),
          scale = 1,
          debug = false,
        } = config;

        const scaleVector = new THREE.Vector3(scale, scale, scale);

        const decal = new THREE.Mesh(
          new kokomi.DecalGeometry(parent, position, rotation, scaleVector),
          new THREE.MeshStandardMaterial({
            map,
            transparent: true,
            polygonOffset: true,
            polygonOffsetFactor: -10,
          })
        );

        // debug decal
        if (debug) {
          decal.geometry = new THREE.BoxGeometry();
          decal.material = new THREE.MeshNormalMaterial({
            wireframe: true,
          });
          decal.position.copy(position);
          decal.rotation.copy(rotation);
          decal.scale.copy(scale);
        }

        this.scene.add(decal);
        return decal;
      };

      // pick
      if (globalConfig.isPickEnabled) {
        const rs = new kokomi.RaycastSelector(this);
        this.container.addEventListener("click", () => {
          const target = rs.onChooseIntersect(shirt);
          if (target) {
            const p = target.point;

            addDecal({
              parent: shirt,
              map: am.items[globalConfig.decal],
              position: p,
              scale: 2,
            });
          }
        });
      }

      // decal
      setTimeout(() => {
        addDecal({
          parent: shirt,
          map: am.items[globalConfig.decal],
          position: new THREE.Vector3(0, 1, 1.25),
          scale: 2,
        });
      });

      // shadow
      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.ShadowMaterial({
          opacity: 0.5,
        })
      );
      this.scene.add(shadowPlane);
      shadowPlane.position.z = -2;
      shadowPlane.receiveShadow = true;

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.1);
      dirLight.position.set(5, 5, 8);
      dirLight.castShadow = true;
      dirLight.shadow.bias = -0.001;
      dirLight.shadow.mapSize.width = 256;
      dirLight.shadow.mapSize.height = 256;
      dirLight.shadow.radius = 5;
      dirLight.shadow.blurSamples = 25;
      this.scene.add(dirLight);
    });
  }
}
