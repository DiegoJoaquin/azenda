import type { Metadata } from "next";
import LegalShell from "@/components/legal/LegalShell";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Política de Privacidad — Azenda",
};

const UPDATED = "13 de julio de 2026";

export default function PrivacidadPage() {
  return (
    <LegalShell title="Política de Privacidad" updated={UPDATED}>
      <p>
        Esta Política explica cómo <strong>Azenda</strong> (el
        <strong> “Servicio”</strong>) trata los datos personales, en cumplimiento
        de la Ley N° 19.628 y de la Ley N° 21.719 sobre protección de datos
        personales de Chile. Para cualquier gestión relativa a tus datos,
        escríbenos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <div className="callout">
        <p>
          <strong>Dos roles distintos.</strong> Cuando un <em>negocio</em>{" "}
          contrata Azenda para gestionar su agenda, ese negocio es el{" "}
          <strong>responsable</strong> de los datos de sus clientes y Azenda es su{" "}
          <strong>encargado</strong> (procesa los datos por cuenta del negocio y
          según sus instrucciones). Respecto de los datos de la propia cuenta del
          negocio y del sitio de marketing, Azenda actúa como responsable. Abajo
          se detalla cada caso.
        </p>
      </div>

      <h2>1. Quién trata tus datos</h2>
      <p>
        El responsable del Servicio es su Operador, con contacto en{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Utilizamos
        proveedores de infraestructura que actúan como sub-encargados: Supabase
        (base de datos y autenticación), Vercel (alojamiento) y Resend (envío de
        correos). Estos proveedores pueden almacenar datos en servidores ubicados
        fuera de Chile, aplicando medidas de resguardo adecuadas.
      </p>

      <h2>2. Qué datos tratamos y con qué finalidad</h2>
      <h3>a) Datos de la cuenta del negocio (Azenda como responsable)</h3>
      <ul>
        <li>
          <strong>Datos:</strong> correo, contraseña (almacenada cifrada), nombre
          del negocio, rubro, dirección, teléfono.
        </li>
        <li>
          <strong>Finalidad:</strong> crear y administrar la cuenta, dar soporte,
          gestionar el cobro y enviar avisos operativos.
        </li>
        <li>
          <strong>Base de licitud:</strong> la ejecución del contrato de servicio
          contigo.
        </li>
      </ul>
      <h3>b) Datos de los clientes finales del negocio (Azenda como encargado)</h3>
      <ul>
        <li>
          <strong>Datos:</strong> nombre, correo, teléfono, historial de citas y
          notas que el negocio registre.
        </li>
        <li>
          <strong>Finalidad:</strong> permitir la reserva y gestión de citas por
          cuenta del negocio.
        </li>
        <li>
          <strong>Base de licitud:</strong> la determina el negocio responsable
          (por lo general, la relación con su cliente o el consentimiento de
          este). El negocio se obliga a contar con dicha base.
        </li>
      </ul>
      <h3>c) Datos de navegación</h3>
      <p>
        Usamos almacenamiento local del navegador y cookies estrictamente
        necesarias para el funcionamiento (por ejemplo, mantener tu sesión). No
        usamos cookies de publicidad ni de seguimiento de terceros.
      </p>

      <h2>3. Con quién compartimos datos</h2>
      <p>
        No vendemos datos personales. Solo los compartimos con los proveedores de
        infraestructura indicados, en la medida necesaria para operar el Servicio,
        y cuando una ley u orden de autoridad competente lo exija.
      </p>

      <h2>4. Plazo de conservación</h2>
      <p>
        Conservamos los datos mientras la cuenta esté activa. Tras el cierre de la
        cuenta, mantenemos una ventana de 30 días para que puedas solicitar una
        copia, y luego eliminamos o anonimizamos los datos de forma segura, salvo
        que una obligación legal exija conservarlos por más tiempo.
      </p>

      <h2>5. Tus derechos (ARCO+)</h2>
      <p>
        Como titular de datos, puedes ejercer los derechos de{" "}
        <strong>acceso, rectificación, cancelación (supresión), oposición,
        portabilidad y bloqueo</strong>. Para ejercerlos, escríbenos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> y responderemos
        dentro del plazo legal.
      </p>
      <div className="callout">
        <p>
          Si eres cliente de un negocio y quieres ejercer estos derechos sobre los
          datos que ese negocio registró, dirígete directamente al negocio (es el
          responsable). Azenda, como encargado, apoyará al negocio para atender tu
          solicitud.
        </p>
      </div>

      <h2>6. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas proporcionales al riesgo,
        entre ellas: cifrado en tránsito (HTTPS/HSTS), contraseñas almacenadas con
        funciones de hash, aislamiento de datos entre negocios mediante políticas
        de seguridad a nivel de fila, control de acceso por roles y una política
        de seguridad interna documentada. Ningún sistema es completamente
        infalible, pero trabajamos para reducir los riesgos.
      </p>

      <h2>7. Notificación de brechas</h2>
      <p>
        Si detectamos una vulneración de seguridad que afecte datos personales,
        notificaremos a los responsables afectados y, cuando corresponda, a la
        autoridad competente dentro de los plazos que fija la ley (72 horas desde
        que tomemos conocimiento, conforme a la Ley N° 21.719).
      </p>

      <h2>8. Acuerdo de Tratamiento de Datos (encargo)</h2>
      <p>
        Cuando un negocio usa Azenda, este acuerdo forma parte del contrato y
        regula el tratamiento de los datos de sus clientes. En su virtud, Azenda,
        como encargado, se obliga a:
      </p>
      <ul>
        <li>Tratar los datos solo siguiendo las instrucciones del negocio responsable y para las finalidades del Servicio.</li>
        <li>No usar esos datos para fines propios ni cederlos a terceros ajenos a los sub-encargados indicados.</li>
        <li>Mantener la confidencialidad y aplicar las medidas de seguridad descritas.</li>
        <li>Apoyar al responsable en la atención de los derechos de los titulares y en la notificación de brechas.</li>
        <li>Eliminar o devolver los datos al término del servicio, según se indique.</li>
      </ul>
      <p>
        Por su parte, el negocio responsable se obliga a contar con la base de
        licitud para tratar los datos de sus clientes y a informar a estos de
        forma adecuada.
      </p>

      <h2>9. Menores de edad</h2>
      <p>
        El Servicio está dirigido a negocios y personas mayores de edad. Si un
        negocio registra datos de menores, es su responsabilidad contar con la
        autorización de quien ejerza la patria potestad o el cuidado personal,
        conforme a la ley.
      </p>

      <h2>10. Cambios a esta Política</h2>
      <p>
        Podremos actualizar esta Política. Los cambios relevantes se comunicarán
        por el Servicio o al correo registrado. La fecha de la última
        actualización aparece al inicio de este documento.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Para consultas sobre privacidad o para ejercer tus derechos, escríbenos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}
