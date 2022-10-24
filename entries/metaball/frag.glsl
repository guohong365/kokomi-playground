uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

uniform sampler2D uTexture;
uniform float uRatio;
uniform float uRand[BALL_COUNT];
uniform vec2 uMetaballsPos[BALL_COUNT];
uniform float uMetaballsRadius[BALL_COUNT];

// Credit: https://jamie-wong.com/2016/07/06/metaballs-and-webgl/
vec4 getMetaball(vec4 tex){
    vec4 col=vec4(0.);
    
    float x=gl_FragCoord.x;
    float y=gl_FragCoord.y;
    
    float v=0.;
    for(int i=0;i<BALL_COUNT;i++){
        vec2 pos=uMetaballsPos[i];
        float r=uMetaballsRadius[i];
        float dx=pos.x-x/2.;
        float dy=pos.y-y/2.;
        v+=r*r/(dx*dx+dy*dy);
        if(v>1.){
            return vec4(tex.rgb,1.);
        }
    }
}

void main(){
    vec2 p=vUv;
    
    vec4 tex=texture(uTexture,p);
    
    vec4 col=getMetaball(tex);
    
    csm_DiffuseColor=col;
}