uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform sampler2D uTexture;

varying vec2 vUv;

uniform vec2 uMeshSize;
uniform vec2 uMeshPosition;

void main(){
    vec2 uv=gl_FragCoord.xy/iResolution.xy;
    uv.x*=iResolution.x/iResolution.y;
    
    vec4 tex=texture(uTexture,uv);
    
    gl_FragColor=tex;
}