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

    kokomi.enableShadow(this.renderer);

    this.scene.background = new THREE.Color("#0b0b11");

    // model: https://sketchfab.com/3d-models/cyberpunk-car-b4301ff99d214d16a7a43708a5866bf0
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

      modelParts.forEach((item) => {
        if (item.material) {
          // emissive
          item.material.toneMapped = false;
          item.material.emissiveIntensity = 10;

          // envmap
          item.material.envMapIntensity = 0.5;
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
        const smaa = new POSTPROCESSING.SMAAEffect();
        const ssr = new SSREffect(this.scene, this.camera, {
          temporalResolve: true,
          STRETCH_MISSED_RAYS: true,
          USE_MRT: true,
          USE_NORMALMAP: true,
          USE_ROUGHNESSMAP: true,
          ENABLE_JITTERING: true,
          ENABLE_BLUR: true,
          temporalResolveMix: 0.9,
          temporalResolveCorrectionMix: 0.25,
          maxSamples: 0,
          resolutionScale: 1,
          blurMix: 0.5,
          blurKernelSize: 8,
          blurSharpness: 0.5,
          rayStep: 0.3,
          intensity: 1,
          maxRoughness: 0.1,
          jitter: 0.7,
          jitterSpread: 0.45,
          jitterRough: 0.1,
          roughnessFadeOut: 1,
          rayFadeOut: 0,
          MAX_STEPS: 20,
          NUM_BINARY_SEARCH_STEPS: 5,
          maxDepthDifference: 3,
          maxDepth: 1,
          thickness: 10,
          ior: 1.45,
        });

        const effectPass = new POSTPROCESSING.EffectPass(
          this.camera,
          bloom,
          smaa,
          ssr
        );
        composer.addPass(effectPass);

        this.renderer.autoClear = true;
      };

      createPostprocessing();
    });
  }
}
