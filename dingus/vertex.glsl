attribute vec4 a_vertex_pos;

uniform mat4 u_modelview_mat;
uniform mat4 u_projection_mat;

void main(void) {
    //gl_Position = u_projection_mat * u_modelview_mat * a_vertex_pos;
    gl_Position = a_vertex_pos;
}
