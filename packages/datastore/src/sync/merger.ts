import { Storage } from '../storage/storage';
import { ModelInstanceMetadata, PersistentModelConstructor } from '../types';
import { MutationEventOutbox } from './outbox';

class ModelMerger {
	constructor(
		private readonly outbox: MutationEventOutbox,
		private readonly ownSymbol: Symbol
	) {}

	public async merge<T extends ModelInstanceMetadata>(
		storage: Storage,
		model: T
	): Promise<void> {
		const mutationsForModel = await this.outbox.getForModel(storage, model);

		const isDelete = model._deleted;

		if (mutationsForModel.length === 0) {
			if (isDelete) {
				await storage.delete(model, undefined, this.ownSymbol);
			} else {
				await storage.save(model, undefined, this.ownSymbol);
			}
		}

		return;
	}

	public async mergePage(
		storage: Storage,
		modelConstructor: PersistentModelConstructor<any>,
		items: ModelInstanceMetadata[]
	): Promise<void> {
		// skip deleted
		const itemsToSave = items.filter(({ _deleted }) => !_deleted);

		await storage.batchSave(modelConstructor, itemsToSave);
	}
}

export { ModelMerger };
