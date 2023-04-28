uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

varying vec2 vUv;

const float PI=3.14159265359;

const float TWO_PI=6.28318530718;

// noise
//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x){
    return x-floor(x*(1./289.))*289.;
}

vec2 mod289(vec2 x){
    return x-floor(x*(1./289.))*289.;
}

vec3 permute(vec3 x){
    return mod289(((x*34.)+1.)*x);
}

float snoise(vec2 v)
{
    const vec4 C=vec4(.211324865405187,// (3.0-sqrt(3.0))/6.0
    .366025403784439,// 0.5*(sqrt(3.0)-1.0)
    -.577350269189626,// -1.0 + 2.0 * C.x
.024390243902439);// 1.0 / 41.0
// First corner
vec2 i=floor(v+dot(v,C.yy));
vec2 x0=v-i+dot(i,C.xx);

// Other corners
vec2 i1;
//i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
//i1.y = 1.0 - i1.x;
i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
// x0 = x0 - 0.0 + 0.0 * C.xx ;
// x1 = x0 - i1 + 1.0 * C.xx ;
// x2 = x0 - 1.0 + 2.0 * C.xx ;
vec4 x12=x0.xyxy+C.xxzz;
x12.xy-=i1;

// Permutations
i=mod289(i);// Avoid truncation effects in permutation
vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))
+i.x+vec3(0.,i1.x,1.));

vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
m=m*m;
m=m*m;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

vec3 x=2.*fract(p*C.www)-1.;
vec3 h=abs(x)-.5;
vec3 ox=floor(x+.5);
vec3 a0=x-ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
m*=1.79284291400159-.85373472095314*(a0*a0+h*h);

// Compute final noise value at P
vec3 g;
g.x=a0.x*x0.x+h.x*x0.y;
g.yz=a0.yz*x12.xz+h.yz*x12.yw;
return 130.*dot(m,g);
}

float fbm(in vec2 uv){
float value=0.;
float amplitude=1.;
float frequency=2.;
float lacunarity=2.;
float persistence=.5;
int octaves=6;

for(int i=0;i<octaves;i++){
    value+=amplitude*snoise(uv*frequency);
    frequency*=lacunarity;
    amplitude*=persistence;
}

return value;
}

// rotate
mat2 rotation2d(float angle){
float s=sin(angle);
float c=cos(angle);

return mat2(
    c,-s,
    s,c
);
}

mat4 rotation3d(vec3 axis,float angle){
axis=normalize(axis);
float s=sin(angle);
float c=cos(angle);
float oc=1.-c;

return mat4(
    oc*axis.x*axis.x+c,oc*axis.x*axis.y-axis.z*s,oc*axis.z*axis.x+axis.y*s,0.,
    oc*axis.x*axis.y+axis.z*s,oc*axis.y*axis.y+c,oc*axis.y*axis.z-axis.x*s,0.,
    oc*axis.z*axis.x-axis.y*s,oc*axis.y*axis.z+axis.x*s,oc*axis.z*axis.z+c,0.,
    0.,0.,0.,1.
);
}

vec2 rotate(vec2 v,float angle){
return rotation2d(angle)*v;
}

vec3 rotate(vec3 v,vec3 axis,float angle){
return(rotation3d(axis,angle)*vec4(v,1.)).xyz;
}

mat3 rotation3dX(float angle){
float s=sin(angle);
float c=cos(angle);

return mat3(
    1.,0.,0.,
    0.,c,s,
    0.,-s,c
);
}

vec3 rotateX(vec3 v,float angle){
return rotation3dX(angle)*v;
}

mat3 rotation3dY(float angle){
float s=sin(angle);
float c=cos(angle);

return mat3(
    c,0.,-s,
    0.,1.,0.,
    s,0.,c
);
}

vec3 rotateY(vec3 v,float angle){
return rotation3dY(angle)*v;
}

mat3 rotation3dZ(float angle){
float s=sin(angle);
float c=cos(angle);

return mat3(
    c,s,0.,
    -s,c,0.,
    0.,0.,1.
);
}

vec3 rotateZ(vec3 v,float angle){
return rotation3dZ(angle)*v;
}

float sdSphere(vec3 p,float s)
{
return length(p)-s;
}

float sdRoundBox(vec3 p,vec3 b,float r)
{
vec3 d=abs(p)-b;
return min(max(d.x,max(d.y,d.z)),0.)+length(max(d,0.))-r;
}

float sdBox(vec3 p,vec3 b)
{
vec3 q=abs(p)-b;
return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);
}

float sdCylinder(vec3 p,vec2 h)
{
vec2 d=abs(vec2(length(p.xz),p.y))-h;
return min(max(d.x,d.y),0.)+length(max(d,0.));
}

float opUnion(float d1,float d2)
{
return min(d1,d2);
}

vec2 opUnion(vec2 d1,vec2 d2)
{
return(d1.x<d2.x)?d1:d2;
}

float opSmoothUnion(float d1,float d2,float k)
{
float h=max(k-abs(d1-d2),0.);
return min(d1,d2)-h*h*.25/k;
}

float opIntersection(float d1,float d2)
{
return max(d1,d2);
}

float opSmoothIntersection(float d1,float d2,float k)
{
float h=max(k-abs(d1-d2),0.);
return max(d1,d2)+h*h*.25/k;
}

float opSubtraction(float d1,float d2)
{
return max(-d1,d2);
}

float opSmoothSubtraction(float d1,float d2,float k)
{
float h=max(k-abs(-d1-d2),0.);
return max(-d1,d2)+h*h*.25/k;
}

vec2 map(vec3 p){
vec2 d=vec2(1e10,0.);

return d;
}

vec3 calcNormal(vec3 pos,float eps){
const vec3 v1=vec3(1.,-1.,-1.);
const vec3 v2=vec3(-1.,-1.,1.);
const vec3 v3=vec3(-1.,1.,-1.);
const vec3 v4=vec3(1.,1.,1.);

return normalize(v1*map(pos+v1*eps).x+
v2*map(pos+v2*eps).x+
v3*map(pos+v3*eps).x+
v4*map(pos+v4*eps).x);
}

vec3 calcNormal(vec3 pos){
return calcNormal(pos,.002);
}

// float saturate(float a){
//     return clamp(a,0.,1.);
// }

float diffuse_(vec3 n,vec3 l){
float diff=saturate(dot(n,l));
return diff;
}

float specular(vec3 n,vec3 l,float shininess){
float spec=pow(saturate(dot(n,l)),shininess);
return spec;
}

vec3 material(vec3 col,vec3 normal,float m){
col=vec3(1.);

if(m==1.){
    col=vec3(0.);
}

if(m==2.){
    col=vec3(1.);
}

if(m==3.){
    col=vec3(1.,0.,0.);
}

return col;
}

vec3 lighting(vec3 col,vec3 normal,vec3 eyeVector){
vec3 result=vec3(0.);

// ambient
vec3 ambiColor=vec3(.4,.8,1.);
float ambiIntensity=.4;
vec3 ambiLight=ambiColor*ambiIntensity;
result+=col*ambiLight;

// diffuse
vec3 diffPosition=vec3(1.);
vec3 diffColor=vec3(1.);
float diffIntensity=.6;
float diffFactor=diffuse_(normal,normalize(diffPosition));
vec3 diffLight=diffFactor*diffColor*diffIntensity;
result+=col*diffLight;

// specular
vec3 specPosition=vec3(1.);
float specShininess=32.;
vec3 specColor=vec3(1.);
float specIntensity=.6;
vec3 specReflect=reflect(-normalize(specPosition),normal);
float specFactor=specular(-eyeVector,specReflect,specShininess);
vec3 specLight=specFactor*specColor*specIntensity;
result+=col*specLight;

return result;
}

const float gamma=2.2;

float toGamma(float v){
return pow(v,1./gamma);
}

vec2 toGamma(vec2 v){
return pow(v,vec2(1./gamma));
}

vec3 toGamma(vec3 v){
return pow(v,vec3(1./gamma));
}

vec4 toGamma(vec4 v){
return vec4(toGamma(v.rgb),v.a);
}

void mainImage(out vec4 fragColor,in vec2 fragCoord)
{
vec2 uv=fragCoord/iResolution.xy;

// uv (0,1) -> (-1,1)
uv=2.*uv-1.;
// uv.x*=iResolution.x/iResolution.y;

vec3 col=vec3(0.);

// camera
vec3 ca=vec3(0.,0.,-3.);
float z=100.;
vec3 rd=normalize(vec3(uv,z));

// raymarch
float depth=.0;
for(int i=0;i<128;i++){
    vec3 p=ca+rd*depth;
    
    // orbit
    // vec2 mouse=iMouse.xy/iResolution.xy;
    // p.yz=rotate(p.yz,-mouse.y*PI+1.);
    // p.xz=rotate(p.xz,-mouse.x*TWO_PI);
    
    vec2 t=map(p);
    float d=t.x;
    float m=t.y;
    
    // skybox
    float factor=rd.y;
    
    // factor=fbm(vec2(rd.x+iTime*.6*.01,rd.y+iTime*-.6*.01));
    
    col=mix(vec3(.11,.31,.69),vec3(.3,.59,.77),factor*2.);
    
    // hit
    if(d<.0001){
        col=vec3(1.);
        vec3 nor=calcNormal(p);
        col=material(col,nor,m);
        col=lighting(col,nor,normalize(-ca));
        break;
    }
    
    depth+=d;
}

col=toGamma(col);

fragColor=vec4(col,1.);
}

void main(){
mainImage(gl_FragColor,vUv*iResolution.xy);
}