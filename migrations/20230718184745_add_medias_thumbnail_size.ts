import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('medias', function (table) {
    table.dropIndex(['accountId', 'mimeType'], 'medias_accountId_mimeType_idx')
    table.dropIndex(['actorId', 'mimeType'], 'medias_actorId_mimeType_idx')

    table.renameColumn('bytes', 'originalBytes')
    table.renameColumn('mimeType', 'originalMimeType')

    table.bigint('thumbnailBytes').unsigned().nullable()
    table.string('thumbnailMimeType').nullable()

    table.index(
      ['accountId', 'originalMimeType'],
      'medias_accountId_originalMimeType_idx'
    )
    table.index(
      ['actorId', 'originalMimeType'],
      'medias_actorId_originalMimeType_idx'
    )
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('medias', function (table) {
    table.dropIndex(
      ['accountId', 'originalMimeType'],
      'medias_accountId_originalMimeType_idx'
    )
    table.dropIndex(
      ['actorId', 'originalMimeType'],
      'medias_actorId_originalMimeType_idx'
    )

    table.dropColumn('thumbnailBytes')
    table.dropColumn('thumbnailMimeType')

    table.renameColumn('originalBytes', 'bytes')
    table.renameColumn('originalMimeType', 'mimeType')

    table.index(['accountId', 'mimeType'], 'medias_accountId_mimeType_idx')
    table.index(['actorId', 'mimeType'], 'medias_actorId_mimeType_idx')
  })
}
