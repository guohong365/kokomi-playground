uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform sampler2D uMatcapTex;
uniform sampler2D uScanTex;
uniform vec3 uScanOrigin;
uniform float uScanSpeed;
uniform float uScanWaveRatio1;
uniform float uScanWaveRatio2;
uniform vec3 uScanColorDark;
uniform vec3 uScanColor;

// https://ycw.github.io/three-shaderlib-skim/dist/#/latest/matcap/fragment
vec2 matcap2(vec3 viewPosition,vec3 normal){
    vec3 viewDir=normalize(viewPosition);
    vec3 x=normalize(vec3(viewDir.z,0.,-viewDir.x));
    vec3 y=cross(viewDir,x);
    vec2 uv=vec2(dot(x,normal),dot(y,normal))*.495+.5;
    return uv;
}

vec2 getScanUv(){
    vec2 scanUv=fract(vWorldPosition.xz);
    if(vNormal.y<0.){
        scanUv=vUv*10.;
    }
    return scanUv;
}

float circleWave(vec3 p,vec3 origin,float distRatio){
    float t=iTime*uScanSpeed;
    
    float dist=distance(p,origin)*distRatio;
    
    float radialMove=fract(dist-t);
    
    float fadeOutMask=1.-smoothstep(1.,3.,dist);
    radialMove*=fadeOutMask;
    
    float cutInitialMask=1.-step(t,dist);
    radialMove*=cutInitialMask;
    
    // return dist;
    return radialMove;
    // return fadeOutMask;
    // return cutInitialMask;
}

vec3 getScanColor(vec3 worldPos,vec2 uv,vec3 col){
    // mask
    float scanMask=texture(uScanTex,uv).r;
    
    // waves
    float cw=circleWave(worldPos,uScanOrigin,uScanWaveRatio1);
    float cw2=circleWave(worldPos,uScanOrigin,uScanWaveRatio2);
    
    // scan
    float mask1=smoothstep(.3,0.,1.-cw);
    mask1*=(1.+scanMask*.7);
    
    float mask2=smoothstep(.07,0.,1.-cw2)*.8;
    mask1+=mask2;
    
    float mask3=smoothstep(.09,0.,1.-cw)*1.5;
    mask1+=mask3;
    
    // color
    vec3 scanCol=mix(uScanColorDark,uScanColor,mask1);
    col=mix(col,scanCol,mask1);
    
    return col;
    // return worldPos;
    // return vec3(scanMask);
    // return vec3(cw);
    // return vec3(mask1);
    // return scanCol;
}

void main(){
    vec2 p=vUv;
    
    vec2 matcapP=matcap2(vViewPosition,vNormal);
    vec3 matcapTex=texture(uMatcapTex,matcapP).xyz;
    
    vec3 col=matcapTex;
    
    vec2 scanUv=getScanUv();
    col=getScanColor(vWorldPosition,scanUv,col);
    
    gl_FragColor=vec4(col,1.);
}