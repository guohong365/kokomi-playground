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
              value: 0.4,
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
            uScanColor: {
              value: new THREE.Color("#00D8FF"),
            },
            uScanColorDark: {
              value: new THREE.Color("#7AFFEF"),
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
          dummy.position.set(i - row / 2, -10, j - col / 2);
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
    });
  }
}
