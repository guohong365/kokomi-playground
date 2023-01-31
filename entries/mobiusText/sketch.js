import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  async create() {
    this.camera.position.set(0, 0, 3.5);

    new kokomi.OrbitControls(this);

    kokomi.enableRealisticRender(this.renderer);

    const am = new kokomi.AssetManager(this, [
      {
        name: "font",
        type: "font",
        path: "../../assets/Folklore_Regular.json",
      },
      {
        name: "hdr",
        type: "hdrTexture",
        path: "../../assets/potsdamer_platz_1k.hdr",
      },
      // {
      //   name: "matcapTex",
      //   type: "texture",
      //   path: "https://s2.loli.net/2023/01/31/NdvQ14ieOVq9FE7.png",
      // },
    ]);
    am.on("ready", () => {
      document.querySelector(".loader-screen").classList.add("hollow");

      const envMap = kokomi.getEnvmapFromHDRTexture(
        this.renderer,
        am.items["hdr"]
      );

      const text = "ALPHARDEXISGOD";

      const t3d = new kokomi.Text3D(
        this,
        text,
        am.items["font"],
        {
          size: 1,
          height: 0.5,
          curveSegments: 50,
          bevelEnabled: false,
        },
        {
          // baseMaterial: new THREE.ShaderMaterial(),
          baseMaterial: new THREE.MeshStandardMaterial(),
          // baseMaterial: new THREE.MeshMatcapMaterial(),
          vertexShader,
          fragmentShader,
          materialParams: {
            side: THREE.DoubleSide,
            envMap,
            metalness: 1,
            roughness: 0.3,
            // matcap: am.items["matcapTex"],
          },
          uniforms: {
            uMin: {
              value: new THREE.Vector3(0, 0, 0),
            },
            uMax: {
              value: new THREE.Vector3(0, 0, 0),
            },
            uColor: {
              value: new THREE.Color("#66ccff"),
            },
          },
        }
      );
      t3d.addExisting();
      t3d.mesh.geometry.center();

      t3d.mesh.material.uniforms.uMin.value = t3d.mesh.geometry.boundingBox.min;
      t3d.mesh.material.uniforms.uMax.value = t3d.mesh.geometry.boundingBox.max;

      // t3d.mesh.geometry = new THREE.BoxGeometry(
      //   text.length,
      //   1,
      //   1,
      //   100,
      //   100,
      //   100
      // );

      const ambiLight = new THREE.AmbientLight(0xffffff, 1);
      this.scene.add(ambiLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      dirLight.position.set(1, 2, 3);
      this.scene.add(dirLight);
    });
  }
}
