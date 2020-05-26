using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.IO;
using OpenTK.Graphics.OpenGL;
using OpenTK;

namespace CG_Lab_3
{
    public partial class Form1 : Form
    {

        bool CamChanging = false;
        float CamPosX = 1f, CamPosY = 0f, CamPosZ = -8f;
        int MouseX, MouseY;
        float ShiftX1, ShiftY1, ShiftX2, ShiftY2;
        int materialType = 1;
        float reflection = 0, refraction = 1;
        int TraceDeep = 4;


        public Form1()
        {
            InitializeComponent();
        }

        int BasicProgramID;
        int BasicVertexShader;
        int BasicFragmentShader;

        void loadShader(String filename, ShaderType type, int program, out int address)
        {
            address = GL.CreateShader(type);
            using (StreamReader sr = new StreamReader(filename))
            {
                GL.ShaderSource(address, sr.ReadToEnd());
            }
            GL.CompileShader(address);
            GL.AttachShader(program, address);
            Console.WriteLine(GL.GetShaderInfoLog(address));
        }

        public void InitShader()
        {
            // создание объекта программы 
            BasicProgramID = GL.CreateProgram();
            loadShader("..\\..\\raytracing.vert", ShaderType.VertexShader, BasicProgramID,
                       out BasicVertexShader);
            loadShader("..\\..\\raytracing.frag", ShaderType.FragmentShader, BasicProgramID,
                        out BasicFragmentShader);
            //Компановка программы
            GL.LinkProgram(BasicProgramID);

            // Проверить успех компановки
            int status = 0;
            GL.GetProgram(BasicProgramID, GetProgramParameterName.LinkStatus, out status);

            Console.WriteLine(GL.GetProgramInfoLog(BasicProgramID));
            GL.Enable(EnableCap.Texture2D);
        }

        public void Draw()
        {
            GL.ClearColor(Color.AliceBlue);
            GL.Clear(ClearBufferMask.ColorBufferBit | ClearBufferMask.DepthBufferBit);
            GL.UseProgram(BasicProgramID);
            //GL.DrawArrays(PrimitiveType.Triangles, 0, 3);
            // Camera
            int location = GL.GetUniformLocation(BasicProgramID, "uCamera.Position");
            // GL.Uniform3(location, new Vector3(-1, -1, -2));
            GL.Uniform3(location, new Vector3(CamPosX, CamPosY, CamPosZ));
            location = GL.GetUniformLocation(BasicProgramID, "uCamera.Up");
            GL.Uniform3(location, Vector3.UnitY);
            location = GL.GetUniformLocation(BasicProgramID, "uCamera.Side");
            GL.Uniform3(location, Vector3.UnitX);
            location = GL.GetUniformLocation(BasicProgramID, "uCamera.View");
            GL.Uniform3(location, Vector3.UnitZ);
            location = GL.GetUniformLocation(BasicProgramID, "uCamera.Scale");
            GL.Uniform2(location, new Vector2(1, (float)glControl1.Height / glControl1.Width));
            //Материал
            location = GL.GetUniformLocation(BasicProgramID, "material");
            GL.Uniform1(location, materialType);
            location = GL.GetUniformLocation(BasicProgramID, "reflection");
            GL.Uniform1(location, reflection);
            location = GL.GetUniformLocation(BasicProgramID, "refraction");
            GL.Uniform1(location, refraction);
            location = GL.GetUniformLocation(BasicProgramID, "TraceDeep");
            GL.Uniform1(location, TraceDeep);

            GL.Begin(PrimitiveType.Quads);
            GL.Vertex3(-1, -1, 0);
            GL.Vertex3(-1, 1, 0);
            GL.Vertex3(1, 1, 0);
            GL.Vertex3(1, -1, 0);
            GL.End();
            GL.UseProgram(0);

        }

        private void trackBar1_Scroll(object sender, EventArgs e)
        {
            reflection = trackBar1.Value / 20f;
            glControl1.Invalidate();
        }

        private void numericUpDown1_ValueChanged(object sender, EventArgs e)
        {
            TraceDeep = Convert.ToInt32(numericUpDown1.Value);
            glControl1.Invalidate();
        }

        private void trackBar2_Scroll(object sender, EventArgs e)
        {
            refraction = trackBar2.Value / 20f;
            glControl1.Invalidate();
        }

        private void comboBox1_SelectedIndexChanged(object sender, EventArgs e)
        {
            materialType = comboBox1.SelectedIndex + 1;
            glControl1.Invalidate();
        }

        private void glControl1_Load(object sender, EventArgs e)
        {
            InitShader();
        }

        private void glControl1_Paint(object sender, PaintEventArgs e)
        {
            Draw();
            glControl1.SwapBuffers();
        }

        private void glControl1_MouseMove(object sender, MouseEventArgs e)
        {
            if(CamChanging)
            {
                ShiftX1 = ShiftX2 + 0.01f * (MouseX - e.X);
                ShiftY1 = ShiftY2 - 0.01f * (MouseY - e.Y);
                CamPosX = ShiftX1;
                CamPosY = ShiftY1;
                glControl1.Invalidate();
            }
            
        }

        private void glControl1_MouseDown(object sender, MouseEventArgs e)
        {
            MouseX = e.X;
            MouseY = e.Y;
            ShiftX2 = CamPosX;
            ShiftY2 = CamPosY;
            CamChanging = true;
        }

        private void glControl1_MouseUp(object sender, MouseEventArgs e)
        {

            CamChanging = false;
        }
    }
}
