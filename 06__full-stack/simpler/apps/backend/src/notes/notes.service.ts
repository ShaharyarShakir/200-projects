import { Injectable, NotFoundException } from '@nestjs/common';
import { NotesRepository } from './notes.repository';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNoteDto } from './dto/query-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly notesRepository: NotesRepository) {}

  async create(userId: string, dto: CreateNoteDto) {
    return this.notesRepository.create(userId, dto);
  }

  async findAll(userId: string, query: QueryNoteDto) {
    return this.notesRepository.findAll(userId, query);
  }

  async findOne(userId: string, id: string) {
    const note = await this.notesRepository.findOne(userId, id);
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    const note = await this.notesRepository.update(userId, id, dto);
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async delete(userId: string, id: string) {
    const success = await this.notesRepository.delete(userId, id);
    if (!success) throw new NotFoundException('Note not found');
    return { success: true };
  }

  async toggleFavorite(userId: string, id: string) {
    const note = await this.findOne(userId, id);
    return this.update(userId, id, { favorite: !note.favorite });
  }

  async attachToTask(userId: string, id: string, taskId: string) {
    return this.update(userId, id, { taskId });
  }

  async detachFromTask(userId: string, id: string) {
    return this.update(userId, id, { taskId: null });
  }

  async convertToTask(userId: string, id: string) {
    return this.notesRepository.convertToTask(userId, id);
  }
}
