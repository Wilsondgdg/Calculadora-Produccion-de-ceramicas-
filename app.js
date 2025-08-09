// app.js
import { db } from './firebase-config.js';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    deleteDoc,
    updateDoc,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

let total = 0;

// Cargar referencias desde Firestore al <select>
export async function cargarReferencias() {
    const refSelect = document.getElementById("ref");
    const snapshot = await getDocs(collection(db, "valores"));
    snapshot.forEach((docSnap) => {
        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = docSnap.id;
        refSelect.appendChild(option);
    });
}

// Obtener valor unitario según referencia y proceso
export async function obtenerValorUnitario(ref, proc) {
    const docRef = doc(db, "valores", ref);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        alert("Referencia no encontrada.");
        return null;
    }
    const data = docSnap.data();
    return data[proc];
}

// Registrar nuevo trabajo
export async function registrar() {
    const ref = document.getElementById("ref").value;
    const cant = parseInt(document.getElementById("cantidad").value);
    const proc = document.getElementById("proceso").value;
    const dia = document.getElementById("dia").value;

    if (!ref || isNaN(cant)) {
        alert("Completa todos los campos correctamente.");
        return;
    }

    const unitario = await obtenerValorUnitario(ref, proc);
    if (!unitario) return;

    const subtotal = unitario * cant;
    total += subtotal;

    const docRef = await addDoc(collection(db, "trabajos"), {
        referencia: ref,
        cantidad: cant,
        proceso: proc,
        dia: dia,
        valorUnitario: unitario,
        total: subtotal,
        fecha: new Date().toISOString()
    });

    agregarFilaTabla(docRef.id, ref, cant, proc, dia, unitario, subtotal);

    document.getElementById("total").innerText = `💰 Total generado: $${total}`;
    document.getElementById("cantidad").value = "";
}

// Agregar fila en tabla con botones
function agregarFilaTabla(id, ref, cant, proc, dia, unitario, subtotal) {
    const tabla = document.querySelector("#tabla tbody");
    const fila = tabla.insertRow();
    fila.setAttribute("data-id", id);
    fila.innerHTML = `
        <td>${ref}</td>
        <td>${cant}</td>
        <td>${proc.charAt(0).toUpperCase() + proc.slice(1)}</td>
        <td>${dia}</td>
        <td>$${unitario}</td>
        <td>$${subtotal}</td>
        <td>
            <button onclick="editarRegistro('${id}')">✏️</button>
            <button onclick="eliminarRegistro('${id}')">🗑️</button>
        </td>
    `;
}

// Eliminar registro
window.eliminarRegistro = async function (id) {
    if (confirm("¿Seguro que quieres eliminar este registro?")) {
        await deleteDoc(doc(db, "trabajos", id));
        document.querySelector(`#tabla tbody tr[data-id="${id}"]`).remove();
        recalcularTotal();
    }
};

// Editar registro
window.editarRegistro = async function (id) {
    const docSnap = await getDoc(doc(db, "trabajos", id));
    if (!docSnap.exists()) return;

    const data = docSnap.data();
    document.getElementById("ref").value = data.referencia;
    document.getElementById("cantidad").value = data.cantidad;
    document.getElementById("proceso").value = data.proceso;
    document.getElementById("dia").value = data.dia;

    // Cambiar el botón "Registrar" por "Actualizar"
    const registrarBtn = document.querySelector("button[onclick='registrar()']");
    registrarBtn.style.display = "none";

    let actualizarBtn = document.getElementById("btn-actualizar");
    if (!actualizarBtn) {
        actualizarBtn = document.createElement("button");
        actualizarBtn.id = "btn-actualizar";
        actualizarBtn.textContent = "Actualizar";
        actualizarBtn.onclick = async () => {
            const nuevaRef = document.getElementById("ref").value;
            const nuevaCant = parseInt(document.getElementById("cantidad").value);
            const nuevoProc = document.getElementById("proceso").value;
            const nuevoDia = document.getElementById("dia").value;
            const nuevoUnitario = await obtenerValorUnitario(nuevaRef, nuevoProc);
            const nuevoTotal = nuevaCant * nuevoUnitario;

            await updateDoc(doc(db, "trabajos", id), {
                referencia: nuevaRef,
                cantidad: nuevaCant,
                proceso: nuevoProc,
                dia: nuevoDia,
                valorUnitario: nuevoUnitario,
                total: nuevoTotal
            });

            // Actualizar tabla
            const fila = document.querySelector(`#tabla tbody tr[data-id="${id}"]`);
            fila.innerHTML = `
                <td>${nuevaRef}</td>
                <td>${nuevaCant}</td>
                <td>${nuevoProc.charAt(0).toUpperCase() + nuevoProc.slice(1)}</td>
                <td>${nuevoDia}</td>
                <td>$${nuevoUnitario}</td>
                <td>$${nuevoTotal}</td>
                <td>
                    <button onclick="editarRegistro('${id}')">✏️</button>
                    <button onclick="eliminarRegistro('${id}')">🗑️</button>
                </td>
            `;

            recalcularTotal();
            document.getElementById("btn-actualizar").remove();
            registrarBtn.style.display = "inline-block";
        };
        registrarBtn.parentNode.insertBefore(actualizarBtn, registrarBtn.nextSibling);
    }
};

// Recalcular total
function recalcularTotal() {
    total = 0;
    document.querySelectorAll("#tabla tbody tr").forEach(fila => {
        const valor = fila.children[5].innerText.replace("$", "");
        total += parseFloat(valor);
    });
    document.getElementById("total").innerText = `💰 Total generado: $${total}`;
}

// 🔹 NUEVO: Cargar trabajos existentes al iniciar
async function cargarTrabajosGuardados() {
    const tabla = document.querySelector("#tabla tbody");
    tabla.innerHTML = "";
    total = 0;

    // Traer registros ordenados por fecha (más recientes primero)
    const q = query(collection(db, "trabajos"), orderBy("fecha", "desc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        agregarFilaTabla(docSnap.id, data.referencia, data.cantidad, data.proceso, data.dia, data.valorUnitario, data.total);
        total += data.total;
    });

    document.getElementById("total").innerText = `💰 Total generado: $${total}`;
}

// Ejecutar al cargar la página
window.addEventListener("DOMContentLoaded", () => {
    cargarReferencias();
    cargarTrabajosGuardados(); // <-- Aquí cargamos registros guardados
    window.registrar = registrar;
});
