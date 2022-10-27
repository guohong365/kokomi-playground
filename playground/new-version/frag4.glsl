uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform vec3 uTextColor;

varying vec2 vUv;

void main(){
    vec3 col=uTextColor;
    gl_FragColor=vec4(col,1.);
}