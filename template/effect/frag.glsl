uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform sampler2D tDiffuse;

varying vec2 vUv;

void main(){
    vec2 p=vUv;
    vec4 tex=texture(tDiffuse,p);
    vec4 col=tex;
    gl_FragColor=col;
}