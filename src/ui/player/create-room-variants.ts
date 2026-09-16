import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { RoomType } from "../../core/vibe/room-presets.ts";

/** Alternate architectural shells keep the shared furniture and clear walking corridors. */
export function createRoomVariants(scene: THREE.Scene) {
  const rooftop = new THREE.Group(), cloud = new THREE.Group();
  scene.add(rooftop, cloud);
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = [];
  const mat = (color: string, glow = false) => {
    const m = new THREE.MeshStandardMaterial({color, roughness:0.85, ...(glow ? {emissive:color,emissiveIntensity:0.6} : {})}); materials.push(m); return m;
  };
  const timber = mat("#a5764d"), pale = mat("#d8b887"), cream = mat("#ecdfc6"), slate = mat("#444b5a"), metal = mat("#31343b"), green = mat("#71815a"), stone = mat("#7b7975");
  const gold = mat("#ffd58d",true), cyan = mat("#5bb3c4",true), rose = mat("#b9769f",true), cloudMat = mat("#e8dceb");
  function mesh(parent:THREE.Object3D, geo:THREE.BufferGeometry, m:THREE.Material, x:number,y:number,z:number) {
    geometries.push(geo); const object=new THREE.Mesh(geo,m); object.position.set(x,y,z); object.castShadow=true; object.receiveShadow=true; parent.add(object); return object;
  }
  const box=(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>mesh(parent,new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const orb=(parent:THREE.Object3D,x:number,y:number,z:number,r:number,m:THREE.Material)=>mesh(parent,new THREE.SphereGeometry(r,16,12),m,x,y,z);
  function deck(parent:THREE.Group,m:THREE.Material) {
    box(parent,8.25,0.22,6.3,0,-0.17,0,m);
    for(let row=0;row<15;row++) for(let col=0;col<4;col++) box(parent,1.98,0.07,0.39,-3+col*2,-0.02,-2.8+row*.4,m);
  }
  function rail(parent:THREE.Group,x:number,z:number,length:number,alongX:boolean,m:THREE.Material) {
    const count=Math.ceil(length/.7);
    for(let i=0;i<=count;i++) box(parent,.055,.9,.055,x+(alongX?i*length/count:0),.48,z+(alongX?0:i*length/count),m);
    box(parent,alongX?length+.1:.07,.08,alongX?.07:length+.1,x+(alongX?length/2:0),.94,z+(alongX?0:length/2),m);
  }
  function plant(parent:THREE.Group,x:number,z:number,glowing=false) {
    box(parent,.34,.32,.34,x,.18,z,cream);
    for(let i=0;i<5;i++) {
      const leaf=orb(parent,x+Math.cos(i*2.4)*.14,.5+(i%2)*.16,z+Math.sin(i*2.4)*.14,.13,green); leaf.scale.set(.65,1.8,.7);
      if(glowing) orb(parent,x+Math.cos(i*2.4)*.15,.7+(i%2)*.16,z,.045,gold);
    }
  }
  deck(rooftop,timber);
  // Warm enclosed rear corner, open front terrace and metal railing.
  box(rooftop,8.1,3.5,.12,0,1.7,-3.02,slate);
  box(rooftop,.15,3.5,3.1,-4,1.7,-1.48,timber);
  box(rooftop,4.8,.17,2.65,-1.62,3.53,-1.8,metal);
  box(rooftop,.13,3.5,.13,-.9,1.7,-.47,timber);
  box(rooftop,4.8,.1,.1,-1.62,3.4,-.47,timber);
  // A recessed panorama: overlapping city silhouettes replace detached toy towers.
  const sky = new THREE.MeshBasicMaterial({color:"#555568"});
  const haze = new THREE.MeshBasicMaterial({color:"#786676"});
  const distant = new THREE.MeshBasicMaterial({color:"#646171"});
  const middle = new THREE.MeshBasicMaterial({color:"#454858"});
  const near = new THREE.MeshBasicMaterial({color:"#303a49"});
  const windowGlow = new THREE.MeshBasicMaterial({color:"#d6b68a"});
  const dimGlow = new THREE.MeshBasicMaterial({color:"#8b8e9c"});
  materials.push(sky,haze,distant,middle,near,windowGlow,dimGlow);
  box(rooftop,4.55,2.38,.09,1.25,2.12,-2.94,metal);
  const view = new THREE.Group(); view.position.set(-.94,1.02,-2.88); rooftop.add(view);
  const pane = (w:number,h:number,x:number,y:number,z:number,m:THREE.Material) => {
    const plane=mesh(view,new THREE.PlaneGeometry(w,h),m,x,y,z);
    plane.castShadow=false; plane.receiveShadow=false; return plane;
  };
  pane(4.38,2.2,2.19,1.1,0,sky);
  pane(4.38,.65,2.19,.325,.002,haze);
  function skyline(buildings: readonly (readonly [number,number,number,number])[], z:number, m:THREE.Material, lit:boolean) {
    buildings.forEach(([x,w,h,roof],index) => {
      const shape=new THREE.Shape(); shape.moveTo(x,0);shape.lineTo(x,h);
      if(roof===1) { shape.lineTo(x+w*.25,h);shape.lineTo(x+w*.25,h+.12);shape.lineTo(x+w*.72,h+.12);shape.lineTo(x+w*.72,h); }
      if(roof===2) { shape.lineTo(x+w*.5,h+.16); }
      shape.lineTo(x+w,h);shape.lineTo(x+w,0);shape.closePath();
      const building=mesh(view,new THREE.ShapeGeometry(shape),m,0,0,z);
      building.castShadow=false;building.receiveShadow=false;
      if(!lit) return;
      const columns=Math.max(1,Math.floor(w/.09));
      for(let row=0;row<Math.floor((h-.08)/.13);row++) for(let col=0;col<columns;col++) {
        // Stable, uneven occupancy leaves whole floors dark and small warm clusters.
        const seed=(index*43+row*17+col*29+row*col*7)%23;
        if(seed>7 || (row+index)%5===0) continue;
        pane(.018+(seed%3)*.007,.028,x+(col+.5)*w/columns,.09+row*.13,z+.001,seed<5?windowGlow:dimGlow);
      }
    });
  }
  skyline([[0,.48,.7,0],[.35,.26,1.02,1],[.54,.47,.86,0],[.92,.25,1.26,2],[1.13,.52,.8,0],[1.55,.29,.98,0],[1.78,.37,1.5,1],[2.07,.22,1.18,0],[2.22,.62,.67,0],[2.74,.31,1.01,2],[2.98,.38,1.28,0],[3.25,.51,.85,1],[3.67,.31,1.07,0],[3.91,.47,.73,0]],.008,distant,false);
  skyline([[0,.37,.47,0],[.29,.43,.65,1],[.64,.23,1.05,0],[.85,.55,.5,0],[1.31,.31,.76,2],[1.58,.5,.56,0],[2,.32,.93,1],[2.29,.22,1.38,1],[2.49,.41,.65,0],[2.85,.56,.46,0],[3.36,.25,.9,2],[3.57,.45,.58,1],[3.98,.4,.97,0]],.014,middle,true);
  skyline([[0,.61,.24,1],[.55,.48,.36,0],[.97,.7,.22,0],[1.61,.37,.42,1],[1.95,.56,.29,0],[2.44,.67,.2,0],[3.05,.51,.38,0],[3.53,.85,.26,1]],.02,near,true);
  // Slim mullions and a deep sill make the city read as a view beyond glass.
  box(rooftop,4.65,.11,.24,1.25,.99,-2.78,timber);
  for(const x of [-.96,1.35,3.46]) box(rooftop,.045,2.23,.07,x,2.12,-2.82,metal);
  rail(rooftop,-3.9,3,7.8,true,metal); rail(rooftop,3.95,-2.8,5.8,false,metal);
  for(const x of [-3.6,3.6]) { plant(rooftop,x,2.75); box(rooftop,.18,.45,.15,x,1.9,-2.85,gold); }
  box(rooftop,.045,1.15,.04,3.35,2.4,-2.85,cyan);
  box(rooftop,.6,.04,.04,3.05,2.95,-2.85,rose);
  // Low exterior seating stays outside the established walking routes.
  mesh(rooftop,new RoundedBoxGeometry(1.15,.23,.5,3,.08),cream,2.65,.55,2.78);
  box(rooftop,1.15,.42,.1,2.65,.83,3,timber);
  box(rooftop,1.5,.13,.33,0,-.25,3.3,stone);
  box(rooftop,1.8,.13,.33,0,-.38,3.61,stone);

  deck(cloud,pale);
  // An airy arched wood shell rather than the original square living-room walls.
  for(const x of [-4,-1.3,1.3,4]) box(cloud,.15,3.5,.15,x,1.72,-3,pale);
  for(const center of [-2.65,0,2.65]) {
    const arch=mesh(cloud,new THREE.TorusGeometry(1.22,.075,8,40,Math.PI),pale,center,2.1,-3); arch.scale.y=.9;
    box(cloud,2.55,.18,.3,center,1.03,-3,pale);
  }
  for(const z of [-2.95,-1.8]) {
    const arch=mesh(cloud,new THREE.TorusGeometry(4,.11,8,48,Math.PI),timber,0,2.1,z); arch.scale.y=.5;
  }
  for(let i=0;i<11;i++) {
    const angle=i*Math.PI/10;
    box(cloud,.11,.11,1.3,Math.cos(angle)*4,2.1+Math.sin(angle)*2,-2.38,pale);
  }
  rail(cloud,-3.9,3,7.8,true,pale); rail(cloud,3.95,-2.8,5.8,false,pale);
  for(const x of [-3.6,3.6]) plant(cloud,x,2.72,true);
  // Floating island and cloud bank below the playable floor.
  for(let i=0;i<22;i++) {
    const rock=mesh(cloud,new THREE.DodecahedronGeometry(.75,0),stone,Math.sin(i*2.4)*3.4,-.6-(i%3)*.25,Math.cos(i*2.4)*2.5); rock.scale.y=1.2+(i%3)*.3;
    const puff=orb(cloud,Math.sin(i*2.4)*4.2,-1.2-(i%4)*.12,Math.cos(i*2.4)*3.3,.7,cloudMat); puff.scale.set(1.7,.55,1.1);
  }
  for(let i=0;i<30;i++) orb(cloud,-6+(i*37%120)/10,2.6+(i*17%30)/10,-6-(i%3),.025+(i%2)*.014,gold);
  // Reclining chair tucked into the deck edge, away from walking corridors.
  const recliner=new THREE.Group(); recliner.position.set(2.7,0,2.3); cloud.add(recliner);
  mesh(recliner,new RoundedBoxGeometry(.65,.15,1.2,3,.08),cream,0,.43,0);
  const back=mesh(recliner,new RoundedBoxGeometry(.65,.8,.14,3,.08),cream,0,.79,-.53); back.rotation.x=-.32;
  for(const x of [-.26,.26]) box(recliner,.06,.43,1.1,x,.22,0,timber);
  rooftop.visible=false; cloud.visible=false;
  return {
    setRoom(type:RoomType) {rooftop.visible=type==="rooftop";cloud.visible=type==="cloud";},
    dispose() {geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());scene.remove(rooftop,cloud);},
  };
}
