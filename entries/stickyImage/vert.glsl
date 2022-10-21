uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform float uProgress;
uniform float uDirection;
uniform float uOffset;
uniform float uWaveIntensity;

float saturate(float a){
    return clamp(a,0.,1.);
}

vec3 sticky(vec3 p,vec2 uv){
    vec2 center=vec2(.5);
    float centerDist=distance(uv,center);
    float norDist=centerDist/length(center);
    float stickEffect=mix(-norDist,norDist,uDirection);
    
    float offset=uOffset;
    
    // float stickProgress=1.;
    
    // V wave
    float stick=.5;
    float waveIn=uProgress*(1./stick);
    float waveOut=-(uProgress-1.)*(1./(1.-stick));
    waveOut=pow(smoothstep(0.,1.,waveOut),.7);
    float stickProgress=min(waveIn,waveOut);
    
    // float offsetProgress=uProgress;
    
    float offsetIn=saturate(waveIn);
    // Invert waveOut to get the slope moving upwards to the right and move 1 the left
    float offsetOut=saturate(1.-waveOut);
    float offsetProgress=mix(offsetIn,offsetOut,uDirection);
    
    p.z+=offset*stickEffect*stickProgress-offset*offsetProgress;
    
    // sin wave
    p.z+=sin(centerDist*8.-iTime*5.)*100.*uWaveIntensity;
    
    return p;
}

void main(){
    vec3 p=position;
    p=sticky(p,uv);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    
    vUv=uv;
}