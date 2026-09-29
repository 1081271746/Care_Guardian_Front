import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Api } from '../../services/api';

@Component({
  selector: 'app-notas',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe
  ],
  templateUrl: './notas.html',
  styleUrl: './notas.css'
})
export class Notas implements OnInit {

  // ==========================================
  // CONFIGURACIÓN DEL PACIENTE
  // ==========================================

  patientId = 1;

  // ==========================================
  // DATOS
  // ==========================================

  notes: any[] = [];

  loading = true;
  saving = false;

  errorMessage = '';
  successMessage = '';

  showForm = false;

  // ==========================================
  // NUEVA NOTA
  // ==========================================

  newNote = {
    contenido: ''
  };

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  ngOnInit(): void {
    this.loadNotes();
  }

  // ==========================================
  // CARGAR NOTAS
  // ==========================================

  loadNotes(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.getPatientNotes(this.patientId).subscribe({
      next: (data) => {
        this.notes = data;
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Error cargando notas:', error);

        this.errorMessage =
          error?.error?.detail ||
          'No fue posible cargar las notas del paciente.';

        this.loading = false;

        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // ABRIR FORMULARIO
  // ==========================================

  openNoteForm(): void {
    this.showForm = true;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();
  }

  // ==========================================
  // CERRAR FORMULARIO
  // ==========================================

  closeNoteForm(): void {
    this.showForm = false;

    this.errorMessage = '';

    this.resetForm();

    this.cdr.detectChanges();
  }

  // ==========================================
  // CREAR NOTA
  // ==========================================

  createNote(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const content = this.newNote.contenido.trim();

    if (!content) {
      this.errorMessage =
        'Escribe una observación antes de guardar la nota.';

      this.cdr.detectChanges();

      return;
    }

    if (content.length < 5) {
      this.errorMessage =
        'La nota debe tener al menos 5 caracteres.';

      this.cdr.detectChanges();

      return;
    }

    if (content.length > 5000) {
      this.errorMessage =
        'La nota no puede superar los 5000 caracteres.';

      this.cdr.detectChanges();

      return;
    }

    this.saving = true;

    const noteData = {
      contenido: content
    };

    this.api.createNote(
      this.patientId,
      noteData
    ).subscribe({

      next: (note) => {
        console.log('Nota registrada:', note);

        this.saving = false;
        this.showForm = false;

        this.successMessage =
          'Nota registrada correctamente.';

        this.resetForm();

        this.loadNotes();

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Error creando nota:', error);

        this.errorMessage =
          error?.error?.detail ||
          'No fue posible registrar la nota.';

        this.saving = false;

        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // LIMPIAR FORMULARIO
  // ==========================================

  resetForm(): void {
    this.newNote = {
      contenido: ''
    };
  }

  // ==========================================
  // CONTADOR DE CARACTERES
  // ==========================================

  getCharacterCount(): number {
    return this.newNote.contenido.length;
  }

  // ==========================================
  // CLASE VISUAL PARA LA NOTA
  // ==========================================

  getNoteClass(note: any): string {

    if (!note?.contenido) {
      return '';
    }

    const content = note.contenido.toLowerCase();

    if (
      content.includes('dolor') ||
      content.includes('fiebre') ||
      content.includes('mareo') ||
      content.includes('confusión') ||
      content.includes('confusion')
    ) {
      return 'note-warning';
    }

    return 'note-normal';
  }
}