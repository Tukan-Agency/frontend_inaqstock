// Register.jsx
import { useState } from "react";
import axios from "axios";
import { Button, Input, Link, addToast } from "@heroui/react";
import { useNavigate, Link as NavLink } from "react-router-dom";
import { validate } from "../lib/actions.js";
import RegisterForm from "./register-form.jsx";
import Logo from "./objetos/Logo";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    birthday: "",
    email: "",
    password: "",
    cpassword: "",
    address: "",
    company: "",
    contactNumber: "",
    whatsapp: "",
    country: { name: "", code: "", flag: "" },
    currency: { name: "" },
    package: {
      packageId: "default",
      packageName: "Free Plan",
    },
    role: 2,
    sequenceId: Date.now(),
  });

  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [whatsappDifferent, setWhatsappDifferent] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const validationErrors = validate(
      formData.email,
      formData.password,
      formData.password,
      formData.cpassword
    );
    setError(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setIsLoading(true);

      const res = await axios.post(
        import.meta.env.VITE_API_URL + "/api/auth/register",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 201) {
        return navigate("/");
      }
    } catch (e) {
      setError({ email: e.response?.data?.message || "Error desconocido." });
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: "rgb(0 0 0 / 7%)" }}  className="text-foreground bg-background h-[110vh]">
      <div className="flex justify-center pt-32 cursor-pointer">
        <a href="/">
       
          <Logo data={{ height: 220, width: 250 }} />
        </a>
      </div>
      <br />
     <div className="flex justify-center items-center gap-2">
          Ya tienes una cuenta? 
          <Link showAnchorIcon className="text-primary">
            <NavLink to="/">Inicia sesión</NavLink>
          </Link>
        </div>
      <RegisterForm
        formData={formData}
        setFormData={setFormData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        whatsappDifferent={whatsappDifferent}
        setWhatsappDifferent={setWhatsappDifferent}
        selectedCountryCode={selectedCountryCode}
        setSelectedCountryCode={setSelectedCountryCode}
      />
    </div>
  );
}
