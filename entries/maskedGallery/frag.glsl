uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform sampler2D uTexture;

varying vec2 vUv;

uniform vec2 uMeshSize;
uniform vec2 uMeshPosition;
uniform float uDevicePixelRatio;

uniform float uProgress;
uniform float uHover;

void main(){
    vec2 p=vUv;
    // vec2 p=gl_FragCoord.xy/iResolution.xy;
    
    float scale=mix(1.,1.2,uHover);
    p-=vec2(.5);
    p/=scale;
    p+=vec2(.5);
    
    p*=-1.;
    
    // p.x+=uProgress;
    
    vec4 tex=texture(uTexture,p);
    
    float alpha=mix(.6,1.,uHover);
    tex.a*=alpha;
    
    gl_FragColor=tex;
}