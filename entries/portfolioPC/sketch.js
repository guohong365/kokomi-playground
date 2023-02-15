import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  async create() {
    this.camera.position.set(-3, 1.5, 4);
    this.camera.fov = 45;
    this.camera.updateProjectionMatrix();

    new kokomi.OrbitControls(this);

    kokomi.beautifyRender(this.renderer);

    await kokomi.preloadSDFFont("../../assets/HYWenHei-85W.ttf");

    const am = new kokomi.AssetManager(
      this,
      [
        {
          name: "model",
          type: "gltfModel",
          path: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/macbook/model.gltf",
        },
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
      document.querySelector(".main-scene").classList.remove("hollow");

      this.scene.background = new THREE.Color("#343299");

      const envmap = kokomi.getEnvmapFromHDRTexture(
        this.renderer,
        am.items["hdr"]
      );
      this.scene.environment = envmap;

      const model = am.items["model"];
      model.scene.position.y = -1.2;
      model.scene.rotation.x = 0.13;
      this.scene.add(model.scene);

      const float = new kokomi.Float(this, {
        rotationIntensity: 0.4,
      });
      float.addExisting();
      float.add(model.scene);

      const cs = new kokomi.ContactShadows(this, {
        opacity: 0.4,
        scale: 5,
        blur: 2.4,
      });
      cs.addExisting();
      cs.group.position.y = -1.4;

      const iframeHtml = new kokomi.Html(
        this,
        document.querySelector(".html-screen"),
        new THREE.Vector3(0, 0, 0),
        {
          transform: true,
          distanceFactor: 1.17,
          group: model.scene,
          occlude: [model.scene],
        }
      );
      iframeHtml.group.position.set(0, 1.56, -1.4);
      iframeHtml.group.rotation.set(-0.256, 0, 0);
      iframeHtml.addExisting();

      const rectLight = new THREE.RectAreaLight(
        new THREE.Color("#343299"),
        65,
        2.5,
        1.65
      );
      rectLight.position.set(0, 0.55, -1.15);
      rectLight.rotation.set(-0.1, Math.PI, 0);
      this.scene.add(rectLight);

      const float2 = new kokomi.Float(this, {
        rotationIntensity: 0.4,
      });
      float2.addExisting();
      float2.add(rectLight);

      const tm = new kokomi.TextMesh(this, "Wang haobin");
      tm.addExisting();
      tm.mesh.font = "../../assets/HYWenHei-85W.ttf";
      tm.mesh.fontSize = 0.8;
      tm.mesh.position.set(2, 0.75, 0.75);
      tm.mesh.rotation.y = -1.25;
      tm.mesh.maxWidth = 2;
      tm.mesh.textAlign = "center";

      const float3 = new kokomi.Float(this, {
        rotationIntensity: 0.4,
      });
      float3.addExisting();
      float3.add(tm.mesh);
    });
  }
}
