import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";

class Fragment extends kokomi.Component {
  constructor(base, config = {}) {
    super(base);

    const { material, points } = config;

    this.points = kokomi.polySort(points);

    // const geometry = new THREE.PlaneGeometry(0.1, 0.1, 16, 16);

    const shape = kokomi.createPolygonShape(this.points, {
      scale: 0.01,
    });
    const geometry = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: 0.0001,
      bevelEnabled: true,
      bevelThickness: 0.0005,
      bevelSize: 0.0005,
      bevelSegments: 1,
    });
    geometry.center();

    const matClone = material.clone();
    matClone.uniforms.uRandom.value = THREE.MathUtils.randFloat(0.1, 1.1);

    const mesh = new THREE.Mesh(geometry, matClone);
    this.mesh = mesh;

    const uj = new kokomi.UniformInjector(this.base);
    this.uj = uj;
  }
  addExisting() {
    this.base.scene.add(this.mesh);
  }
  update() {
    this.uj.injectShadertoyUniforms(this.mesh.material.uniforms);
    gsap.to(this.mesh.material.uniforms.uMouse.value, {
      x: this.base.interactionManager.mouse.x,
    });
    gsap.to(this.mesh.material.uniforms.uMouse.value, {
      y: this.base.interactionManager.mouse.y,
    });

    const lp = this.base.clock.elapsedTime * 0.01;
    this.mesh.material.uniforms.uLightPosition.value.copy(
      new THREE.Vector3(Math.cos(lp), Math.sin(lp), 10)
    );
  }
}

class FragmentGroup extends kokomi.Component {
  constructor(base, config = {}) {
    super(base);

    const { material, layerId = 0, polygons } = config;

    const g = new THREE.Group();
    this.g = g;

    const frags = polygons.map((points, i) => {
      const frag = new Fragment(this.base, {
        material,
        points,
      });
      frag.addExisting();
      const firstPoint = frag.points[0];
      frag.mesh.position.set(
        firstPoint.x * 0.01,
        firstPoint.y * -0.01,
        THREE.MathUtils.randFloat(-3, -1)
      );
      frag.mesh.material.uniforms.uLayerId.value = layerId;
      g.add(frag.mesh);
      return frag;
    });

    this.g.position.z = 2 - 1.5 * layerId;

    this.frags = frags;
  }
  addExisting() {
    this.base.scene.add(this.g);
  }
}

const generatePolygons = (config = {}) => {
  const { gridX = 10, gridY = 20, maxX = 9, maxY = 9 } = config;

  const polygons = [];

  for (let i = 0; i < gridX; i++) {
    for (let j = 0; j < gridY; j++) {
      const points = [];
      let edgeCount = 3;
      const randEdgePossibility = Math.random();
      if (randEdgePossibility > 0 && randEdgePossibility <= 0.2) {
        edgeCount = 3;
      } else if (randEdgePossibility > 0.2 && randEdgePossibility <= 0.55) {
        edgeCount = 4;
      } else if (randEdgePossibility > 0.55 && randEdgePossibility <= 0.9) {
        edgeCount = 5;
      } else if (randEdgePossibility > 0.9 && randEdgePossibility <= 0.95) {
        edgeCount = 6;
      } else if (randEdgePossibility > 0.95 && randEdgePossibility <= 1) {
        edgeCount = 7;
      }
      let firstPoint = {
        x: 0,
        y: 0,
      };
      let angle = THREE.MathUtils.randFloat(0, 2 * Math.PI);
      for (let k = 0; k < edgeCount; k++) {
        if (k === 0) {
          firstPoint = {
            x: (i % maxX) * 10,
            y: (j % maxY) * 10,
          };
          points.push(firstPoint);
        } else {
          // random polar
          const r = 10;
          angle += THREE.MathUtils.randFloat(0, Math.PI / 2);
          const anotherPoint = {
            x: firstPoint.x + r * Math.cos(angle),
            y: firstPoint.y + r * Math.sin(angle),
          };
          points.push(anotherPoint);
        }
      }
      polygons.push(points);
    }
  }

  return polygons;
};

class FragmentWorld extends kokomi.Component {
  constructor(base, config = {}) {
    super(base);

    const { material } = config;

    const fgsContainer = new THREE.Group();
    this.base.scene.add(fgsContainer);
    fgsContainer.position.copy(new THREE.Vector3(-0.36, 0.36, 0.1));

    // fragment groups
    const polygons = generatePolygons();

    const fgs = [...Array(2).keys()].map((item, i) => {
      const fg = new FragmentGroup(this.base, {
        material,
        layerId: i,
        polygons,
      });
      fg.addExisting();
      fgsContainer.add(fg.g);
      return fg;
    });
    this.fgs = fgs;

    // clone group for infinite loop
    const fgsContainer2 = new THREE.Group().copy(fgsContainer.clone());
    fgsContainer2.position.y = fgsContainer.position.y - 1;

    const totalG = new THREE.Group();
    totalG.add(fgsContainer);
    totalG.add(fgsContainer2);
    this.totalG = totalG;

    // anime
    this.floatDistance = 0;
    this.floatSpeed = 1;
    this.floatMaxDistance = 1;
    this.isDashing = false;
  }
  addExisting() {
    this.base.scene.add(this.totalG);
  }
  update() {
    this.floatDistance += this.floatSpeed;

    const y = this.floatDistance * 0.001;
    if (y > this.floatMaxDistance) {
      this.floatDistance = 0;
    }
    if (this.totalG) {
      this.totalG.position.y = y;
    }
  }
  speedUp() {
    gsap.to(this, {
      floatSpeed: 40,
      duration: 4,
      ease: "power2.in",
    });
  }
  speedDown() {
    gsap.to(this, {
      floatSpeed: 1,
      duration: 4,
      ease: "power3.inOut",
    });
  }
  async dash(duration = 3500, cb) {
    if (this.isDashing) {
      return;
    }

    this.isDashing = true;

    this.speedUp();

    await kokomi.sleep(duration);

    if (cb) {
      cb();
    }

    this.speedDown();
  }
  changeTexture(name) {
    this.fgs.forEach((fg) => {
      fg.frags.forEach((frag) => {
        const tex = this.base.am.items[name];
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        frag.mesh.material.uniforms.uTexture.value = tex;
      });
    });
  }
}

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(0, 0, 1.5);
    this.camera.fov = 10;
    this.camera.near = 0.01;
    this.camera.far = 10000;
    this.camera.updateProjectionMatrix();

    new kokomi.OrbitControls(this);

    const start = async () => {
      document.querySelector(".loader-screen").classList.add("hollow");

      await kokomi.sleep(500);

      gsap.to("#sketch", {
        opacity: 1,
      });
    };

    const resourceList = [
      {
        name: "tex1",
        type: "texture",
        path: "https://s2.loli.net/2022/11/19/cqOho3ZKCXfTdzw.jpg",
      },
      {
        name: "tex2",
        type: "texture",
        path: "https://s2.loli.net/2022/11/20/8E6yHP9kAawc7Wr.jpg",
      },
    ];

    const am = new kokomi.AssetManager(this, resourceList);
    this.am = am;
    am.on("ready", async () => {
      const tex = am.items["tex1"];
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;

      const uj = new kokomi.UniformInjector(this);

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: {
          ...uj.shadertoyUniforms,
          uTexture: {
            value: tex,
          },
          uLightPosition: {
            value: new THREE.Vector3(-0.2, -0.2, 3),
          },
          uLightColor: {
            value: new THREE.Color("#eeeeee"),
          },
          uRandom: {
            value: THREE.MathUtils.randFloat(0.1, 1.1),
          },
          uMouse: {
            value: new THREE.Vector2(0.5, 0.5),
          },
          uLayerId: {
            value: 0,
          },
        },
      });

      // fragment world
      const fw = new FragmentWorld(this, {
        material,
      });
      fw.addExisting();

      // postprocessing
      const ce = new kokomi.CustomEffect(this, {
        vertexShader: vertexShader2,
        fragmentShader: fragmentShader2,
        uniforms: {
          uRGBShift: {
            value: 1,
          },
        },
      });
      ce.addExisting();

      await start();
    });
  }
}
