import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";

class Sketch extends kokomi.Base {
  async create() {
    const tex = new THREE.TextureLoader().load(
      "https://s2.loli.net/2022/09/08/gGY4VloDAeUwWxt.jpg"
    );

    new kokomi.OrbitControls(this);

    const size = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const aspect = size.width / size.height;

    const waveAmount = 21;
    const waveDatas = [...Array(waveAmount)].map((item) => ({
      progress: 0,
      center: new THREE.Vector2(0, 0),
      frequency: 0,
      amplitude: 0,
      speed: 5,
    }));

    const cm = new kokomi.CustomMesh(this, {
      baseMaterial: new THREE.ShaderMaterial(),
      geometry: new THREE.PlaneGeometry(1, 1, 256, 256),
      vertexShader,
      fragmentShader,
      materialParams: {
        side: THREE.DoubleSide,
        defines: {
          WAVE_AMOUNT: waveAmount,
        },
      },
      uniforms: {
        uTexture: {
          value: tex,
        },
        uAspect: {
          value: aspect,
        },
        uWaves: {
          value: waveDatas,
        },
      },
    });
    cm.addExisting();
    const { width, height } = kokomi.calcPerspectiveScreenSize(
      0,
      this.camera,
      aspect
    );
    cm.mesh.scale.set(width, height, 1);
    cm.mesh.scale.multiply(new THREE.Vector3(1.1, 1.1, 1));

    const waves = cm.mesh.material.uniforms.uWaves.value;

    const playWaveAnime = (wave, waveConfig, animeConfig = {}) => {
      wave = Object.assign(wave, waveConfig);

      gsap.fromTo(
        wave,
        {
          progress: 0,
        },
        {
          progress: 1,
          duration: 2,
          ease: "none",
          ...animeConfig,
        }
      );
    };

    // mouse click wave
    const playMouseWave = () => {
      let currentWaveId = 0;
      this.interactionManager.add(cm.mesh);
      cm.mesh.addEventListener("click", () => {
        playWaveAnime(waves.slice(0, 10)[currentWaveId % 10], {
          frequency: 3 + THREE.MathUtils.randFloatSpread(2),
          amplitude: 0.05 + THREE.MathUtils.randFloatSpread(0.1),
          center: this.interactionManager.mouse
            .clone()
            .divideScalar(window.devicePixelRatio),
        });
        currentWaveId += 1;
      });
    };

    // random wave
    const playRandomWave = () => {
      const targetWaves = waves.slice(10, 20);
      targetWaves.forEach((wave, i) => {
        playWaveAnime(
          wave,
          {
            frequency: 6,
            amplitude: 0.02,
            center: new THREE.Vector2(
              THREE.MathUtils.randFloatSpread(1 * aspect),
              THREE.MathUtils.randFloatSpread(1)
            ),
          },
          {
            delay: 0.1 * i,
            repeat: -1,
            repeatDelay: 1,
          }
        );
      });
    };

    // center wave
    const playCenterWave = () => {
      const targetWave = waves.slice(-1)[0];
      playWaveAnime(targetWave, {
        frequency: 3,
        amplitude: 0.15,
      });
    };

    playCenterWave();

    await kokomi.sleep(1500);

    playRandomWave();

    playMouseWave();
  }
}
