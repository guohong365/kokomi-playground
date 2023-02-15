import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(4, 6, 8);
    this.camera.fov = 25;
    this.camera.updateProjectionMatrix();

    new kokomi.OrbitControls(this);

    const am = new kokomi.AssetManager(this, [
      {
        name: "ob1Model",
        type: "gltfModel",
        path: "../../assets/ob1.glb",
      },
      {
        name: "sec3Tex",
        type: "texture",
        path: "https://s2.loli.net/2023/02/14/yq9o7GuA4rnNZQs.png",
      },
      {
        name: "scanTex",
        type: "texture",
        path: "https://s2.loli.net/2023/02/14/TEoCpsiV8xG9nUv.png",
      },
    ]);
    am.on("ready", () => {
      document.querySelector(".loader-screen").classList.add("hollow");

      const config = {
        grid: {
          row: 20,
          col: 20,
        },
      };

      // grid
      const ob1Model = am.items["ob1Model"];
      const ob1ModelParts = kokomi.flatModel(ob1Model.scene);
      kokomi.printModel(ob1ModelParts);
      const ob1Obj = ob1ModelParts[1];
      const ob1Geo = ob1Obj.geometry;

      const { row, col } = config.grid;
      const count = row * col;

      const matcapTex = am.items["sec3Tex"];
      const scanTex = am.items["scanTex"];
      scanTex.wrapS = scanTex.wrapT = THREE.RepeatWrapping;
      const uj = new kokomi.UniformInjector(this);
      const gridMat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          ...uj.shadertoyUniforms,
          ...{
            uOffsetY: {
              // value: 0.4,
              value: 0,
            },
            uMatcapTex: {
              value: matcapTex,
            },
            uScanTex: {
              value: scanTex,
            },
            uScanOrigin: {
              value: new THREE.Vector3(0, 0, 0),
            },
            uScanSpeed: {
              value: 0.5,
            },
            uScanWaveRatio1: {
              value: 0.15,
            },
            uScanWaveRatio2: {
              value: 0.13,
            },
            uScanColorDark: {
              value: new THREE.Color("#7AFFEF"),
            },
            uScanColor: {
              value: new THREE.Color("#00D8FF"),
            },
          },
        },
        side: THREE.DoubleSide,
      });
      this.update(() => {
        uj.injectShadertoyUniforms(gridMat.uniforms);
      });
      const gridMesh = new THREE.InstancedMesh(ob1Geo, gridMat, count);
      gridMesh.instanceMatrix.needsUpdate = true;
      this.scene.add(gridMesh);

      const dummy = new THREE.Object3D();

      const randomHeightArr = [];
      const randomArr = [];

      for (let i = 0; i < row; i++) {
        for (let j = 0; j < col; j++) {
          const idx = i * row + j;
          // dummy.position.set(i - row / 2, -10, j - col / 2);
          dummy.position.set(
            i - row / 2,
            -10 + THREE.MathUtils.randFloat(-0.5, 0.5),
            j - col / 2
          );
          dummy.updateMatrix();
          gridMesh.setMatrixAt(idx, dummy.matrix);
          randomHeightArr.push(THREE.MathUtils.randFloat(-0.5, 0.5));
          randomArr.push((idx + 1) * Math.random());
        }
      }

      gridMesh.geometry.setAttribute(
        "aRandomHeight",
        new THREE.InstancedBufferAttribute(new Float32Array(randomHeightArr), 1)
      );
      gridMesh.geometry.setAttribute(
        "aRandom",
        new THREE.InstancedBufferAttribute(new Float32Array(randomArr), 1)
      );

      // postprocessing
      const createPostprocessing = () => {
        const composer = new POSTPROCESSING.EffectComposer(this.renderer);
        composer.addPass(
          new POSTPROCESSING.RenderPass(this.scene, this.camera)
        );

        // ssr
        const ssrEffect = new SSREffect(this.scene, this.camera, {
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
        const ssrPass = new POSTPROCESSING.EffectPass(this.camera, ssrEffect);
        composer.addPass(ssrPass);

        gridMat.userData.needsUpdatedReflections = true;

        this.composer = composer;
      };

      createPostprocessing();
    });
  }
}
