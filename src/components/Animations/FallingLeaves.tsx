import React, { useEffect, useRef } from "react";
import styles from "./FallingLeaves.module.css";

interface Leaf {
  el: HTMLDivElement;
  x: number;
  y: number;
  z: number;
  xSpeedVariation?: number;
  ySpeed?: number;
  rotation?: {
    axis: string;
    value: number;
    speed: number;
  };
}

interface WindOptions {
  magnitude: number;
  maxSpeed: number;
  duration: number;
  start: number;
  speed: number;
}

interface SceneOptions {
  numLeaves: number;
  wind: WindOptions;
}

const FallingLeaves = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    class LeafScene {
      private viewport: HTMLElement;
      private world: HTMLDivElement;
      private leaves: Leaf[];
      private options: SceneOptions;
      private width: number;
      private height: number;
      private timer: number;

      constructor(el: HTMLElement) {
        this.viewport = el;
        this.world = document.createElement("div");
        this.leaves = [];

        this.options = {
          numLeaves: 40,
          wind: {
            magnitude: 1.2,
            maxSpeed: 12,
            duration: 300,
            start: 0,
            speed: 0,
          },
        };

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.timer = 0;
      }

      _resetLeaf(leaf: Leaf) {
        leaf.x = this.width * 2 - Math.random() * this.width * 1.75;
        leaf.y = -10;
        leaf.z = Math.random() * 200;

        if (leaf.x > this.width) {
          leaf.x = this.width + 10;
          leaf.y = Math.random() * this.height / 2;
        }

        if (this.timer === 0) {
          leaf.y = Math.random() * this.height;
        }

        leaf.rotation = {
          axis: Math.random() > 0.5 ? "X" : "Z",
          value: Math.random() * 360,
          speed: Math.random() * 10,
        };

        leaf.xSpeedVariation = Math.random() * 0.8 - 0.4;
        leaf.ySpeed = Math.random() + 1.5;
      }

      _updateLeaf(leaf: Leaf) {
        const windSpeed = this.options.wind.magnitude * Math.sin(this.timer / 50);

        leaf.x -= windSpeed + (leaf.xSpeedVariation || 0);
        leaf.y += leaf.ySpeed || 0;
        if (leaf.rotation) {
          leaf.rotation.value += leaf.rotation.speed;
        }

        leaf.el.style.transform = `translate3d(${leaf.x}px, ${leaf.y}px, ${leaf.z}px) rotate${leaf.rotation?.axis}(${leaf.rotation?.value}deg)`;

        if (leaf.x < -10 || leaf.y > this.height + 10) {
          this._resetLeaf(leaf);
        }
      }

      _updateWind() {
        this.options.wind.magnitude = Math.random() * this.options.wind.maxSpeed;
        this.options.wind.duration = this.options.wind.magnitude * 50;
      }

      init() {
        this.viewport.appendChild(this.world);
        this.world.className = styles.leafScene || "";

        for (let i = 0; i < this.options.numLeaves; i++) {
          const leaf: Leaf = {
            el: document.createElement("div"),
            x: 0,
            y: 0,
            z: 0,
          };
          this._resetLeaf(leaf);
          leaf.el.className = styles.leaf || "";
          this.world.appendChild(leaf.el);
          this.leaves.push(leaf);
        }

        window.onresize = () => {
          this.width = window.innerWidth;
          this.height = window.innerHeight;
        };

        this.render();
      }

      render() {
        this._updateWind();
        this.leaves.forEach((leaf) => this._updateLeaf(leaf));
        this.timer++;
        requestAnimationFrame(this.render.bind(this));
      }
    }

    if (containerRef.current) {
      const leafScene = new LeafScene(containerRef.current);
      leafScene.init();
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return <div ref={containerRef} className={styles.fallingLeaves}></div>;
};

export default FallingLeaves;
