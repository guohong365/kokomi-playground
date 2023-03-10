import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";
import * as POSTPROCESSING from "postprocessing";
import { SSREffect } from "screen-space-reflections";

class Sketch extends kokomi.Base {
  async create() {
    this.camera.position.set(-4, 5, 4);
    this.camera.fov = 25;
    this.camera.updateProjectionMatrix();

    const controls = new kokomi.OrbitControls(this);
    controls.controls.enableDamping = false;
    // controls.controls.enabled = false;

    kokomi.beautifyRender(this.renderer);

    await kokomi.preloadSDFFont("../../assets/HYWenHei-85W.ttf");

    // model: https://sketchfab.com/3d-models/apple-iphone-13-pro-max-4328dea00e47497dbeac73c556121bc9
    const am = new kokomi.AssetManager(
      this,
      [
        {
          name: "model",
          type: "gltfModel",
          path: "../../assets/apple_iphone_13_pro_max.glb",
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

      // bg
      this.scene.background = new THREE.Color("#6e6f74");

      // env
      const envmap = kokomi.getEnvmapFromHDRTexture(
        this.renderer,
        am.items["hdr"]
      );
      this.scene.environment = envmap;

      // placeholder
      // const box = new kokomi.Box(this);
      // box.mesh.scale.setScalar(2);
      // box.mesh.position.y = 0.15;
      // box.mesh.material = new THREE.MeshBasicMaterial({
      //   color: "mediumpurple",
      // });
      // box.addExisting();

      // model
      const model = am.items["model"];
      model.scene.scale.setScalar(3);
      model.scene.rotation.z = Math.PI;
      model.scene.rotation.x = Math.PI / 2;
      // model.scene.rotation.x = Math.PI;
      // model.scene.position.y = 1.5;
      this.scene.add(model.scene);
      this.camera.lookAt(model.scene.position);

      // contact shadows
      const cs = new kokomi.ContactShadows(this, {
        opacity: 0.6,
        scale: 5,
        blur: 2.4,
        color: "#cff4ff",
      });
      cs.addExisting();
      cs.group.position.y = -0.1;

      this.update(() => {
        this.renderer.autoClear = true;
      });

      // model screen
      const modelParts = kokomi.flatModel(model.scene);
      kokomi.printModel(modelParts);

      const Body_Wallpaper_0 = modelParts[12];
      Body_Wallpaper_0.material = new THREE.MeshBasicMaterial({
        color: "black",
        side: THREE.DoubleSide,
      });

      // iframe
      const iframeHtml = new kokomi.Html(
        this,
        document.querySelector(".html-screen"),
        new THREE.Vector3(0, 0, 0),
        {
          transform: true,
          distanceFactor: 0.411,
          group: model.scene,
          occlude: [model.scene],
        }
      );
      iframeHtml.group.position.set(0, 0, -0.026);
      iframeHtml.group.rotation.set(0, 0, 0);
      iframeHtml.addExisting();

      // text
      const tm = new kokomi.TextMesh(this, "kokomi.js");
      tm.addExisting();
      tm.mesh.font = "../../assets/HYWenHei-85W.ttf";
      tm.mesh.fontSize = 0.5;
      tm.mesh.position.set(0.86, 0.32, 0);
      tm.mesh.rotation.y = -1.57;
      tm.mesh.textAlign = "center";

      // plane
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({
          color: "#000000",
          metalness: 0,
          roughness: 0,
        })
      );
      this.scene.add(plane);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.11;

      // orbit
      let orbitAngle = {
        tilt: {
          x: -0.7853981633974482,
          y: 0.8469570726405657,
        },
        front: {
          x: -0.005417163397448434,
          y: 0.24697207264056598,
        },
        current: {
          x: 0,
          y: 0,
        },
        isAnimating: false,
        isPanning: false,
      };

      window.addEventListener("mousedown", () => {
        orbitAngle.isPanning = true;
      });

      window.addEventListener("mouseup", () => {
        orbitAngle.isPanning = false;
      });

      orbitAngle.current = { ...orbitAngle.tilt };

      this.update(() => {
        if (orbitAngle.isAnimating) {
          controls.controls.setAzimuthalAngle(orbitAngle.current.x);
          controls.controls.setPolarAngle(orbitAngle.current.y);
        } else {
          orbitAngle.current.x = controls.controls.getAzimuthalAngle();
          orbitAngle.current.y = controls.controls.getPolarAngle();
        }
      });

      const t1 = gsap.timeline();

      const cameraEnter = () => {
        t1.to(orbitAngle.current, {
          x: orbitAngle.front.x,
          y: orbitAngle.front.y,
          duration: 1,
          onStart() {
            orbitAngle.isAnimating = true;
          },
          onComplete() {
            orbitAngle.isAnimating = false;
          },
        });
      };

      const cameraLeave = () => {
        t1.to(orbitAngle.current, {
          x: orbitAngle.tilt.x,
          y: orbitAngle.tilt.y,
          duration: 1,
          onStart() {
            orbitAngle.isAnimating = true;
          },
          onComplete() {
            orbitAngle.isAnimating = false;
          },
        });
      };

      iframeHtml.el.addEventListener("mouseover", () => {
        if (orbitAngle.isPanning) {
          return;
        }
        cameraEnter();
      });
      iframeHtml.el.addEventListener("mouseleave", () => {
        if (orbitAngle.isPanning) {
          return;
        }
        cameraLeave();
      });

      // postprocessing
      const createPostprocessing = () => {
        // this.scene.background = new THREE.Color("#0a0a0a");

        const composer = new POSTPROCESSING.EffectComposer(this.renderer, {
          frameBufferType: THREE.HalfFloatType,
          multisampling: 8,
        });
        composer.addPass(
          new POSTPROCESSING.RenderPass(this.scene, this.camera)
        );

        // bloom
        const bloom = new POSTPROCESSING.BloomEffect({
          luminanceThreshold: 0.2,
          mipmapBlur: true,
          luminanceSmoothing: 0,
          intensity: 1,
        });
        composer.addPass(new POSTPROCESSING.EffectPass(this.camera, bloom));

        // dof
        const dof = new POSTPROCESSING.DepthOfFieldEffect(this.camera, {
          focusDistance: 0.025,
          focalLength: 0.025,
          bokehScale: 1,
        });
        composer.addPass(new POSTPROCESSING.EffectPass(this.camera, dof));

        // ssr
        // const ssrEffect = new SSREffect(this.scene, this.camera, {
        //   temporalResolve: true,
        //   STRETCH_MISSED_RAYS: true,
        //   USE_MRT: true,
        //   USE_NORMALMAP: true,
        //   USE_ROUGHNESSMAP: true,
        //   ENABLE_JITTERING: true,
        //   ENABLE_BLUR: true,
        //   temporalResolveMix: 0.9,
        //   temporalResolveCorrectionMix: 0.25,
        //   maxSamples: 0,
        //   resolutionScale: 1,
        //   blurMix: 0.5,
        //   blurKernelSize: 8,
        //   blurSharpness: 0.5,
        //   rayStep: 0.3,
        //   intensity: 1,
        //   maxRoughness: 0.1,
        //   jitter: 0.7,
        //   jitterSpread: 0.45,
        //   jitterRough: 0.1,
        //   roughnessFadeOut: 1,
        //   rayFadeOut: 0,
        //   MAX_STEPS: 20,
        //   NUM_BINARY_SEARCH_STEPS: 5,
        //   maxDepthDifference: 3,
        //   maxDepth: 1,
        //   thickness: 10,
        //   ior: 1.45,
        // });
        // const ssrPass = new POSTPROCESSING.EffectPass(this.camera, ssrEffect);
        // composer.addPass(ssrPass);

        this.composer = composer;
      };

      createPostprocessing();

      // custom
      const customIframe = () => {
        const hash = location.hash;
        if (hash) {
          const url = hash.slice(1);
          document.querySelector("iframe").src = url;
        }
      };

      customIframe();
    });
  }
}
