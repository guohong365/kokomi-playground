import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(14.5, 2, 5.5);
    this.camera.fov = 40;
    this.camera.updateProjectionMatrix();

    new kokomi.OrbitControls(this);

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
          name: "model",
          type: "gltfModel",
          path: "../../assets/trees.glb",
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

      // this.scene.environment = envMap;

      const model = am.items["model"];

      // this.scene.add(model.scene);

      const modelParts = kokomi.flatModel(model.scene);
      kokomi.printModel(modelParts);

      // ground
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 1, 1),
        new THREE.ShadowMaterial({
          opacity: 0.4,
        })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -3.05;
      ground.castShadow = true;
      ground.receiveShadow = true;
      this.scene.add(ground);

      // tree
      const Foliage = modelParts[1];

      // const treeMat = new THREE.MeshStandardMaterial({
      //   color: new THREE.Color("#33594e"),
      // });

      // const treeMat = new THREE.MeshToonMaterial({
      //   color: new THREE.Color("#234549"),
      // });

      // https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/ToonShader.js
      const treeMat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColors: {
            value: [
              new THREE.Color("#427062"),
              new THREE.Color("#33594E"),
              new THREE.Color("#234549"),
              new THREE.Color("#1E363F"),
            ],
          },
          uBrightnessThresholds: {
            value: [0.9, 0.45, 0.001],
          },
          uLightPosition: {
            value: new THREE.Vector3(15, 15, 15),
          },
        },
      });

      const treeMat2 = treeMat.clone();
      treeMat2.uniforms.uColors.value = [
        new THREE.Color("#4a8d7e"),
        new THREE.Color("#377f6a"),
        new THREE.Color("#184f52"),
        new THREE.Color("#143b36"),
      ];

      // const treeGeo = new THREE.TorusKnotGeometry();
      const treeGeo = Foliage.geometry;

      const tree = new THREE.Mesh(treeGeo, treeMat);
      tree.castShadow = true;
      tree.receiveShadow = true;

      const tree1 = tree.clone();
      this.scene.add(tree1);
      tree1.position.set(0, 0, -2);

      const tree2 = tree.clone();
      tree2.material = treeMat2;
      this.scene.add(tree2);
      tree2.position.set(0, 0, 4);

      // light
      const ambiLight = new THREE.AmbientLight(0xffffff, 0.1);
      this.scene.add(ambiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      dirLight.position.set(15, 15, 15);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.set(2048, 2048);
      this.scene.add(dirLight);
    });
  }
}
