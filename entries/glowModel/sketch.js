import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";
import * as POSTPROCESSING from "postprocessing";

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(0, 0.2, 5);
    this.camera.fov = 50;
    this.camera.updateProjectionMatrix();

    const controls = new kokomi.OrbitControls(this);

    kokomi.beautifyRender(this.renderer);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.background = new THREE.Color("#252530");

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
          path: "../../assets/cyberpunk_car-transformed.glb",
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

      // model
      const model = am.items["model"];

      const modelParts = kokomi.flatModel(model.scene);
      kokomi.printModel(modelParts);

      model.scene.scale.setScalar(0.01);

      stage.add(model.scene);

      // emissive
      modelParts.forEach((item) => {
        if (item.material) {
          item.material.toneMapped = false;
          item.material.emissiveIntensity = 10;
        }
      });

      // tweak model
      model.scene.rotation.y = THREE.MathUtils.degToRad(150);

      // postprocessing
      const createPostprocessing = () => {
        this.scene.background = this.scene.background.convertSRGBToLinear();

        const composer = new POSTPROCESSING.EffectComposer(this.renderer, {
          frameBufferType: THREE.HalfFloatType,
          multisampling: 8,
        });
        this.composer = composer;

        composer.addPass(
          new POSTPROCESSING.RenderPass(this.scene, this.camera)
        );

        const bloom = new POSTPROCESSING.BloomEffect({
          blendFunction: POSTPROCESSING.BlendFunction.ADD,
          mipmapBlur: true,
          luminanceThreshold: 1,
        });
        const toneMapping = new POSTPROCESSING.ToneMappingEffect({
          adaptive: true,
          resolution: 256,
          middleGrey: 0.4,
          maxLuminance: 16,
          averageLuminance: 1,
          adaptationRate: 1,
        });
        const smaa = new POSTPROCESSING.SMAAEffect();
        const effectPass = new POSTPROCESSING.EffectPass(
          this.camera,
          bloom,
          toneMapping,
          smaa
        );
        effectPass.renderToScreen = true;
        composer.addPass(effectPass);

        this.renderer.autoClear = true;
      };

      createPostprocessing();
    });
  }
}
