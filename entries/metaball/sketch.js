import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";

class Sketch extends kokomi.Base {
  create() {
    const screenCamera = new kokomi.ScreenCamera(this);
    screenCamera.addExisting();

    new kokomi.OrbitControls(this);

    const tex = new THREE.TextureLoader().load(
      `https://s2.loli.net/2022/09/08/gGY4VloDAeUwWxt.jpg`
    );

    const ballCount = 16;

    const cm = new kokomi.CustomMesh(this, {
      baseMaterial: new THREE.ShaderMaterial(),
      geometry: new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
      vertexShader,
      fragmentShader,
      materialParams: {
        side: THREE.DoubleSide,
        defines: {
          BALL_COUNT: ballCount,
        },
      },
      uniforms: {
        uTexture: {
          value: tex,
        },
        uMetaballsPos: {
          value: [0],
        },
        uMetaballsRadius: {
          value: [0],
        },
      },
    });
    cm.addExisting();

    const getBalls = (count = ballCount) => {
      const balls = [...Array(count).keys()].map(() => {
        const r = THREE.MathUtils.randFloat(40, 80);
        const x = Math.random() * (window.innerWidth - 2 * r) + r;
        const y = Math.random() * (window.innerHeight - 2 * r) + r;
        const vx = THREE.MathUtils.randFloat(-5, 5);
        const vy = THREE.MathUtils.randFloat(-5, 5);

        return {
          r,
          x,
          y,
          vx,
          vy,
        };
      });
      return balls;
    };

    const step = (balls) => {
      balls.forEach((mb) => {
        mb.x += mb.vx;
        if (mb.x - mb.r < 0) {
          mb.x = mb.r + 1;
          mb.vx = Math.abs(mb.vx);
        } else if (mb.x + mb.r > window.innerWidth) {
          mb.x = window.innerWidth - mb.r;
          mb.vx = -Math.abs(mb.vx);
        }
        mb.y += mb.vy;
        if (mb.y - mb.r < 0) {
          mb.y = mb.r + 1;
          mb.vy = Math.abs(mb.vy);
        } else if (mb.y + mb.r > window.innerHeight) {
          mb.y = window.innerHeight - mb.r;
          mb.vy = -Math.abs(mb.vy);
        }
      });
    };

    const syncUniforms = (balls) => {
      const uniforms = cm.mesh.material.uniforms;

      uniforms.uMetaballsPos.value = [...Array(ballCount).keys()].map(
        (item, i) => new THREE.Vector2(balls[i].x, balls[i].y)
      );
      uniforms.uMetaballsRadius.value = [...Array(ballCount).keys()].map(
        (item, i) => balls[i].r
      );
    };

    const balls = getBalls(ballCount);

    this.update(() => {
      step(balls);
      syncUniforms(balls);
    });
  }
}
