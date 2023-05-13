import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Point extends kokomi.Component {
  constructor(base, { x, y, mesh, index }) {
    super(base);

    this.pos = new THREE.Vector2(x, y);
    this.originalPos = new THREE.Vector2(x, y);

    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(5, 10, 10),
      new THREE.MeshBasicMaterial({
        color: "#00ff00",
      })
    );

    this.mousePos = new THREE.Vector3(0, 0, 0);

    this.originalMesh = mesh;
    this.index = index;
  }
  addExisting() {
    this.container.add(this.mesh);
  }
  update() {
    const mouseForce = this.originalPos.clone().sub(this.mousePos);
    const dist = mouseForce.length();
    const forceFactor = 1 / Math.max(dist, 0.2);
    const posToGo = this.originalPos
      .clone()
      .sub(mouseForce.normalize().multiplyScalar(20))
      .multiplyScalar(-dist * forceFactor * 1.2);
    this.pos.lerp(posToGo, 0.1);

    this.mesh.position.x = this.pos.x;
    this.mesh.position.y = this.pos.y;

    const posBuffer = this.originalMesh.geometry.attributes.position.array;
    this.originalMesh.geometry.attributes.position.needsUpdate = true;
    posBuffer[this.index * 3] =
      (this.pos.x - this.originalMesh.position.x) / this.originalMesh.scale.x;
    posBuffer[this.index * 3 + 1] = this.pos.y / this.originalMesh.scale.y;
  }
  syncMousePos(p) {
    this.mousePos = p;
  }
}

class Sketch extends kokomi.Base {
  async create() {
    const config = {
      noise: 4,
      debug: false,
    };

    const screenCamera = new kokomi.ScreenCamera(this);
    screenCamera.addExisting();

    // new kokomi.OrbitControls(this);

    const gallary = new kokomi.Gallery(this, {
      vertexShader,
      fragmentShader,
      makuConfig: {
        meshSizeType: "scale",
        segments: {
          // width: 20,
          // height: 10,
          width: 1,
          height: 1,
        },
      },
      uniforms: {
        uMeshSize: {
          value: new THREE.Vector2(0, 0),
        },
        uMeshPosition: {
          value: new THREE.Vector2(0, 0),
        },
        uProgress: {
          value: 0,
        },
      },
    });
    await gallary.addExisting();

    this.update(() => {
      if (gallary.makuGroup) {
        gallary.makuGroup.makus.forEach((maku) => {
          maku.mesh.material.uniforms.uTexture.value.wrapS =
            maku.mesh.material.uniforms.uTexture.value.wrapT =
              THREE.RepeatWrapping;

          gallary.makuGroup.makus.forEach((maku) => {
            maku.mesh.material.uniforms.uMeshSize.value = new THREE.Vector2(
              maku.el.clientWidth,
              maku.el.clientHeight
            );
            maku.mesh.material.uniforms.uMeshPosition.value = new THREE.Vector2(
              maku.mesh.position.x,
              maku.mesh.position.y
            );
          });

          // const posBuffer = maku.mesh.geometry.attributes.position.array;
          // maku.mesh.geometry.attributes.position.needsUpdate = true;
          // kokomi.iterateBuffer(posBuffer, posBuffer.length, (arr, axis) => {
          //   const x = arr[axis.x];
          //   const y = arr[axis.y];
          //   const z = arr[axis.z];
          //   const t = this.clock.elapsedTime;

          //   const noise = Math.sin(y * 2 + t) * 0.2 * 0.01;
          //   // arr[axis.x] += noise;
          // });
        });
      }
    });

    // mouse
    const rs = new kokomi.RaycastSelector(this);

    let p = new THREE.Vector3(0, 0, 0);

    let currentMesh = null;

    // test sphere
    const testSphere = new THREE.Mesh(
      new THREE.SphereGeometry(10, 10, 10),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ff0000"),
        wireframe: true,
      })
    );
    this.scene.add(testSphere);
    if (!config.debug) {
      testSphere.visible = false;
    }

    // points
    // const points = [...Array(4)].map((_) => {
    //   const halfWidth = hitPlane.el.clientWidth / 2;
    //   const halfHeight = hitPlane.el.clientHeight / 2;
    //   const x = THREE.MathUtils.randFloat(-halfWidth, halfWidth);
    //   const y = THREE.MathUtils.randFloat(-halfHeight, halfHeight);
    //   const point = new Point(this, { x, y });
    //   point.addExisting();
    //   return point;
    // });

    // this.update(() => {
    //   points.forEach((point) => {
    //     point.syncMousePos(p);
    //   });
    // });

    // return;

    const makuMeshes = gallary.makuGroup.makus.map((maku) => maku.mesh);
    this.container.addEventListener("mousemove", (e) => {
      const intersects = rs.getInterSects(makuMeshes);
      if (intersects.length > 0) {
        const intersect = intersects[0];
        p = intersect.point;
        currentMesh = intersect.object;
        testSphere.position.copy(p);
      }
    });

    await kokomi.sleep(100);

    let pointGroup = new THREE.Group();
    this.scene.add(pointGroup);

    gallary.makuGroup.makus.forEach((maku) => {
      const posBuffer = maku.mesh.geometry.attributes.position.array;
      maku.mesh.geometry.attributes.position.needsUpdate = true;
      kokomi.iterateBuffer(posBuffer, posBuffer.length, (arr, axis, i) => {
        const x = arr[axis.x] * maku.mesh.scale.x - maku.mesh.position.x;
        const y = arr[axis.y] * maku.mesh.scale.y;

        const noise = kokomi.computeCurl(x, y, 0).multiplyScalar(config.noise);

        const point = new Point(this, {
          x: x + noise.x,
          y: y + noise.y,
          mesh: maku.mesh,
          index: i,
        });
        point.addExisting();
        pointGroup.add(point.mesh);

        this.update(() => {
          point.syncMousePos(p);
        });

        if (!config.debug) {
          point.mesh.visible = false;
        }
      });
    });

    // horizontal scroll
    const wheelScroller = new kokomi.WheelScroller();
    wheelScroller.listenForScroll();

    let progressOffset = 0;
    let posOffset = 0;

    let targetProgressOffset = 0;
    let targetPosOffset = 0;

    const syncGallery = () => {
      wheelScroller.syncScroll();

      if (gallary.makuGroup) {
        gallary.makuGroup.makus.forEach((maku, i) => {
          const sc = wheelScroller.scroll.current;

          targetPosOffset = sc * 0.25;
          targetProgressOffset = sc * 0.001;

          progressOffset = THREE.MathUtils.lerp(
            progressOffset,
            targetProgressOffset,
            0.02
          );
          posOffset = THREE.MathUtils.lerp(posOffset, targetPosOffset, 0.1);

          maku.mesh.material.uniforms.uProgress.value = progressOffset;
          maku.mesh.position.x -= posOffset;

          pointGroup.position.x = -posOffset;
        });
      }
    };

    this.update(() => {
      syncGallery();
    });
  }
}
