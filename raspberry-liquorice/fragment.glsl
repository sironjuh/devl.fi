precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

float mandelbulb(vec3 p, float time) {
    vec3 z = p;
    float dr = 1.;
    float r;
    float power = 7.;

    for(int i = 0; i < 15; ++i) {
        r = length(z);
        if (r > 2.) break;

        float theta = acos(z.z / r) * power;
        float phi = atan(z.y, z.x) * power;
        float zr = pow(r, power);
        dr = pow(r, power - 1.) * power * dr + 1.;

        z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
        z += p;
    }
    return .5 * log(r) * r/dr;
}

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}

float sdf(vec3 p) {
    float time = u_time / 10.;
    vec3 p1 = rotate(p, vec3(sin(time), cos(time), 1.), time);
    return mandelbulb(p1, time);
}

// https://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
vec3 calcNormal(in vec3 p) {
    const float eps = 0.001;
    const vec2 h = vec2(eps,0);
    return normalize(vec3(sdf(p+h.xyy) - sdf(p-h.xyy),
                          sdf(p+h.yxy) - sdf(p-h.yxy),
                          sdf(p+h.yyx) - sdf(p-h.yyx)));
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy - vec2(.5);
    vec3 camPos = vec3(.5, .5, 1.);
    vec3 rayDir = normalize(vec3(uv, -1.));

    // start from camera position
    vec3 rayPos = camPos;
    float dist = 0.;
    float distMax = 15.;
    vec3 currentPos;

    for(int i = 0; i < 20; ++i) {
        currentPos = camPos + dist * rayDir;
        float h = sdf(currentPos);
        if(h < 0.000001 || dist > distMax) break;
        dist += h;
    }

    vec3 color = vec3(0.);

    if(dist < distMax) {
        vec3 normal = calcNormal(currentPos);

        vec3 material = vec3(.5, .1, .3); 
        vec3 lightPos = vec3(.5, .5, -2.);
        vec3 lightCol = vec3(.6, .4, .5);
	
        vec3 lightDir = normalize(lightPos - currentPos);
        vec3 diffuse = dot(lightDir, normal) * lightCol * 55.;
	
        color = diffuse * material;
    }

    gl_FragColor = vec4(color, 1.);
}
