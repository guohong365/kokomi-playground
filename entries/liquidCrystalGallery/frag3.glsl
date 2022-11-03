uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform sampler2D uTexture;

varying vec2 vUv;

uniform float uOpacity;

void main(){
    vec2 p=vUv;
    vec4 tex=texture(uTexture,p);
    vec3 col=tex.rgb;
    float alpha=uOpacity;
    gl_FragColor=vec4(col,alpha);
}