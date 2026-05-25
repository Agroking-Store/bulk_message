import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact } from './schemas/contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { parseCsvContacts } from '../../common/utils/helpers';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { normalizePhoneNumber } from '../../utils/phone-utils';
import { Types } from "mongoose";

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name) private contactModel: Model<Contact>,
    private notificationsService: NotificationsService,
  ) { }

  async addContact(userId: string, dto: CreateContactDto) {
    const normalizedPhone = normalizePhoneNumber(dto.phone);
    if (!normalizedPhone) throw new NotFoundException('Invalid phone number');

    try {
      const contact = await this.contactModel.create({
        ...dto,
        phone: normalizedPhone,
        userId
      });

      await this.notificationsService.createNotification({
        userId,
        title: 'Contact Added',
        message: `${contact.name} added successfully`,
        type: NotificationType.SUCCESS,
      });

      return contact;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('The number already exists');
      }
      throw error;
    }
  }

  async getContacts(userId: string, page = 1, limit = 10, group?: string) {
    const query: any = { userId };

    if (group && group !== 'All contacts') {
      query.group = group;
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.contactModel
        .find(query)
        .sort({ updatedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.contactModel.countDocuments(query),
    ]);

    return { records, total, page, limit };
  }

  async updateContact(
    userId: string,
    id: string,
    dto: Partial<CreateContactDto>
  ) {
    if (dto.phone) {
      const normalizedPhone = normalizePhoneNumber(dto.phone);

      if (!normalizedPhone) {
        throw new NotFoundException('Invalid phone number');
      }

      dto.phone = normalizedPhone;
    }

    try {
      const contact = await this.contactModel.findOneAndUpdate(
        { _id: id, userId },
        dto,
        { new: true }
      );

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }

      await this.notificationsService.createNotification({
        userId,
        title: 'Contact Updated',
        message: `${contact.name} updated successfully`,
        type: NotificationType.INFO
      });

      return contact;
    } catch (error: any) {
  if (error?.code === 11000) {
    throw new ConflictException('The number already exists');
  }

  throw error;
}
  }

  async deleteContact(userId: string, id: string) {
    const contact = await this.contactModel.findOneAndDelete({
      _id: id,
      userId
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.notificationsService.createNotification({
      userId,
      title: 'Contact Deleted',
      message: `${contact.name} deleted successfully`,
      type: NotificationType.ERROR
    });

    return {
      message: 'Contact deleted successfully'
    };
  }
async deleteContactsByGroup(
  userId: string,
  group: string
): Promise<{ deletedCount: number }> {

  console.log("USER: - contacts.service.ts:137", userId);
  console.log("GROUP: - contacts.service.ts:138", group);

  let result;

  // Convert string userId → ObjectId
  const userObjectId = new Types.ObjectId(userId);

  if (group === "ALL") {

    console.log("Deleting ALL contacts - contacts.service.ts:147");

    result = await this.contactModel.deleteMany({
      userId: userObjectId,
    });

  } else {

    console.log("Deleting contacts by group: - contacts.service.ts:155", group);

    result = await this.contactModel.deleteMany({
      userId: userObjectId,
      group: group,
    });

  }

  console.log("DELETED COUNT: - contacts.service.ts:164", result.deletedCount);

  const message =
    result.deletedCount > 0
      ? group === "ALL"
        ? "All contacts deleted successfully"
        : `Contacts from group "${group}" deleted successfully`
      : "No contacts found to delete";

  await this.notificationsService.createNotification({
    userId,
    title: "Contacts Deleted",
    message: message,
    type:
      result.deletedCount > 0
        ? NotificationType.SUCCESS
        : NotificationType.INFO,
  });

  return {
    deletedCount: result.deletedCount,
  };
}
  async getGroups(userId: string): Promise<any> {
    const userObjectId = new Types.ObjectId(userId);
    const groups = await this.contactModel.aggregate([
      { $match: { userId: userObjectId, group: { $exists: true, $ne: '' } } },
      { $group: { _id: "$group", count: { $sum: 1 } } },
      { $project: { name: "$_id", count: 1, _id: 0 } }
    ]);

    const totalContacts = await this.contactModel.countDocuments({ userId: userObjectId });
    return { groups, totalContacts };
  }

  async searchContacts(
    userId: string,
    query: string,
    page = 1,
    limit = 10
  ) {
    const searchStr = String(query || '');

    const filter = {
      userId,
      $or: [
        { name: { $regex: '^' + searchStr, $options: 'i' } },
        { phone: { $regex: searchStr, $options: 'i' } },
      ],
    };

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.contactModel
        .find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.contactModel.countDocuments(filter),
    ]);

    return { records, total, page, limit };
  }


  async processCsv(userId: string, buffer: Buffer) {
    const rawContacts = parseCsvContacts(buffer);
    const totalRows = rawContacts.length;

    const contactMap = new Map<string, any>();
    let invalidCount = 0;

    for (const data of rawContacts) {
      const normalizedPhone = normalizePhoneNumber(data.phone);

      if (normalizedPhone) {
        const existing = contactMap.get(normalizedPhone) || {};
        const newName = data.name || '';
        const newGroup = data.group || '';

        contactMap.set(normalizedPhone, {
          phone: normalizedPhone,
          userId,
          name: (existing.name && existing.name !== 'Unknown') ? existing.name : (newName || 'Unknown'),
          group: (existing.group && existing.group !== 'No Group') ? existing.group : (newGroup || 'No Group'),
        });
      } else {
        invalidCount++;
      }
    }

    const uniqueContactsFromCsv =
      Array.from(contactMap.values());

    const phonesInCsv =
      uniqueContactsFromCsv.map(c => c.phone);

    const now = Date.now();
    const bulkOps = uniqueContactsFromCsv.map((contact, index) => {
      const specificTime = new Date(now + (uniqueContactsFromCsv.length - index));
      return {
        updateOne: {
          filter: { userId, phone: contact.phone },
          update: { $set: { ...contact, updatedAt: specificTime } },
          upsert: true
        }
      };
    });

    let importedCount = 0;
    let updatedCount = 0;

    if (bulkOps.length > 0) {
      try {
        const result = await this.contactModel.bulkWrite(bulkOps, { ordered: false });
        importedCount = result.upsertedCount || 0;
        updatedCount = result.modifiedCount || 0;
      } catch (error) {
        console.error('BulkWrite Error: - contacts.service.ts:284', error);
      }
    }

    const duplicateCount = uniqueContactsFromCsv.length - importedCount - updatedCount;

    await this.notificationsService.createNotification({
      userId,
      title: 'CSV Uploaded',
      message:
        `${totalRows} rows processed: ${importedCount} new imported, ${updatedCount} updated, ${invalidCount} invalid skipped`,
      type: NotificationType.SUCCESS,
    });
let status: "success" | "duplicate" = "success";

if (importedCount === 0) {
  status = "duplicate";
}
return {
  status,
  message: status === "duplicate"
    ? "Contacts already exist"
    : "CSV uploaded successfully",
  totalRows,
  imported: importedCount,
  updated: updatedCount,
  invalid: invalidCount
};


  }
}