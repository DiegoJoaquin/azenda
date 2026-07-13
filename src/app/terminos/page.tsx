import type { Metadata } from "next";
import LegalShell from "@/components/legal/LegalShell";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Azenda",
};

const UPDATED = "13 de julio de 2026";

export default function TerminosPage() {
  return (
    <LegalShell title="Términos y Condiciones de Servicio" updated={UPDATED}>
      <p>
        Estos Términos y Condiciones (los <strong>“Términos”</strong>) regulan
        el acceso y uso de la plataforma <strong>Azenda</strong> (el
        <strong> “Servicio”</strong>), un software de agenda y reservas en línea
        ofrecido a negocios de servicios. El Servicio es operado por su titular
        (el <strong>“Operador”</strong>), con quien podrás comunicarte en{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      <p>
        Al crear una cuenta o utilizar el Servicio, aceptas estos Términos en su
        totalidad. Si contratas en representación de un negocio, declaras tener
        facultades para obligarlo. Si no estás de acuerdo, no debes usar el
        Servicio.
      </p>

      <div className="callout">
        <p>
          <strong>Resumen en simple</strong> (no reemplaza el texto legal):
          Azenda es una herramienta de software para gestionar reservas. Tú y tu
          negocio son responsables de la atención que prestan y de los datos de
          sus clientes; nosotros ponemos el software y hacemos lo razonable por
          mantenerlo disponible y seguro, pero no somos parte de la relación
          entre tu negocio y sus clientes.
        </p>
      </div>

      <h2>1. Descripción del Servicio</h2>
      <p>
        Azenda permite a un negocio publicar una página de reservas, administrar
        su agenda, servicios, equipo y clientes, y recibir reservas en línea. El
        Servicio es una herramienta de gestión: <strong>no</strong> prestamos
        los servicios que tu negocio ofrece, no intermediamos pagos entre tu
        negocio y sus clientes, y no garantizamos que recibirás un número
        determinado de reservas o clientes.
      </p>

      <h2>2. Cuentas y elegibilidad</h2>
      <ul>
        <li>Debes ser mayor de edad y entregar información veraz y vigente.</li>
        <li>
          Eres responsable de mantener la confidencialidad de tu contraseña y de
          toda actividad realizada bajo tu cuenta.
        </li>
        <li>
          Debes notificarnos de inmediato cualquier uso no autorizado de tu
          cuenta a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </li>
      </ul>

      <h2>3. Período de prueba, planes y pago</h2>
      <p>
        El Servicio ofrece un <strong>período de prueba gratuito de 7 días</strong>{" "}
        desde la creación de la cuenta. Vencido ese plazo, para seguir usando el
        Servicio deberás contratar un plan de pago.
      </p>
      <ul>
        <li>
          <strong>Modalidad de pago:</strong> el pago se realiza por
          transferencia bancaria, de forma mensual y anticipada. La cuenta se
          activa manualmente una vez confirmado el pago.
        </li>
        <li>
          <strong>Suspensión por falta de pago:</strong> si no se recibe el pago,
          el acceso al panel se suspende y la página de reservas del negocio se
          pausa. Tus datos se conservan y podrás recuperarlos al regularizar el
          pago.
        </li>
        <li>
          <strong>Sin reembolsos:</strong> los pagos ya realizados no son
          reembolsables, incluyendo períodos parciales en caso de terminación
          anticipada, salvo obligación legal en contrario.
        </li>
        <li>
          <strong>Cambios de precio:</strong> podremos ajustar los precios
          avisando con al menos 30 días de anticipación al correo registrado. El
          nuevo precio rige para los períodos siguientes.
        </li>
      </ul>

      <h2>4. Uso aceptable</h2>
      <p>Al usar el Servicio te obligas a no:</p>
      <ul>
        <li>Usarlo para fines ilícitos o para ofrecer bienes o servicios prohibidos.</li>
        <li>
          Cargar datos de terceros sin la base de licitud correspondiente (por
          ejemplo, sin el consentimiento o la relación contractual que
          justifique tratarlos).
        </li>
        <li>
          Intentar vulnerar la seguridad del Servicio, acceder a datos de otros
          negocios, realizar ingeniería inversa o sobrecargar la infraestructura.
        </li>
        <li>Enviar comunicaciones no solicitadas (spam) a través del Servicio.</li>
      </ul>
      <p>
        El incumplimiento de esta sección faculta al Operador para suspender o
        terminar la cuenta de inmediato.
      </p>

      <h2>5. Contenido y responsabilidad del negocio</h2>
      <p>
        Todo el contenido que cargas —datos de tu negocio, servicios, equipo,
        clientes, notas— es de tu exclusiva responsabilidad. Declaras contar con
        el derecho y la base legal para tratarlo. Respecto de los datos
        personales de tus clientes, <strong>tu negocio actúa como responsable
        del tratamiento</strong> y Azenda como <strong>encargado</strong>, en los
        términos del{" "}
        <a href="/privacidad">Aviso de Privacidad y Acuerdo de Tratamiento de
        Datos</a>.
      </p>

      <h2>6. Disponibilidad del Servicio</h2>
      <p>
        Hacemos esfuerzos razonables para mantener el Servicio disponible, pero
        se entrega <strong>“tal cual” y “según disponibilidad”</strong>. No
        garantizamos que funcione de manera ininterrumpida o libre de errores.
        Podremos realizar mantenciones, actualizaciones o suspensiones temporales,
        procurando avisar cuando sea previsible.
      </p>

      <h2>7. Limitación de responsabilidad</h2>
      <p>
        En la máxima medida permitida por la ley, el Operador no será responsable
        por daños indirectos, incidentales, especiales o consecuenciales, ni por
        lucro cesante, pérdida de clientes, de ingresos o de datos, derivados del
        uso o imposibilidad de uso del Servicio.
      </p>
      <p>
        La responsabilidad total del Operador, por cualquier causa y en conjunto,
        se limita al <strong>monto efectivamente pagado por el negocio en los 3
        meses anteriores</strong> al hecho que originó la responsabilidad.
      </p>
      <p>
        Nada en estos Términos excluye responsabilidades que por ley no puedan
        limitarse (por ejemplo, dolo o culpa grave), ni los derechos que la
        legislación de protección al consumidor reconozca cuando resulte
        aplicable.
      </p>

      <h2>8. Indemnidad</h2>
      <p>
        Te obligas a mantener indemne al Operador frente a reclamos de terceros
        —incluidos tus clientes o autoridades— que deriven del contenido que
        cargas, de los servicios que tu negocio presta o del incumplimiento de
        estos Términos o de la normativa aplicable por tu parte.
      </p>

      <h2>9. Propiedad intelectual</h2>
      <p>
        El software, la marca, el diseño y el código de Azenda pertenecen al
        Operador. Se te otorga una licencia limitada, no exclusiva e
        intransferible para usar el Servicio mientras esté vigente tu cuenta. Los
        datos que cargas siguen siendo tuyos.
      </p>

      <h2>10. Terminación</h2>
      <ul>
        <li>Puedes dejar de usar el Servicio y solicitar el cierre de tu cuenta cuando quieras.</li>
        <li>
          Podremos suspender o terminar tu cuenta por falta de pago, uso indebido
          o incumplimiento de estos Términos.
        </li>
        <li>
          Tras la terminación, podrás solicitar una copia de tus datos dentro de
          los 30 días siguientes; luego podrán ser eliminados de forma segura,
          salvo obligación legal de conservación.
        </li>
      </ul>

      <h2>11. Modificaciones</h2>
      <p>
        Podremos actualizar estos Términos. Los cambios relevantes se avisarán al
        correo registrado o mediante el Servicio, con una antelación razonable. El
        uso posterior del Servicio implica la aceptación de los Términos
        vigentes.
      </p>

      <h2>12. Ley aplicable y jurisdicción</h2>
      <p>
        Estos Términos se rigen por las leyes de la República de Chile.
        Cualquier controversia se someterá a los tribunales ordinarios de justicia
        con competencia en Chile, sin perjuicio de los derechos irrenunciables que
        la ley reconozca al consumidor.
      </p>

      <h2>13. Contacto</h2>
      <p>
        Para cualquier consulta sobre estos Términos, escríbenos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}
