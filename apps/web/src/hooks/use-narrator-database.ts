import { useCallback, useEffect, useMemo, useState } from "react";

import {
	_clearNarratorDatabaseCache,
	type BundledDatabaseMeta,
	getBundledMeta,
	getCachedNarrators,
	getNarratorDatabase,
	type NarratorRecord,
} from "@/lib/narrator-database";
import { useCustomNarrators } from "./use-custom-narrators";

export type { BundledDatabaseMeta };

export interface UseNarratorDatabaseReturn {
	records: NarratorRecord[];
	isLoading: boolean;
	error: string | null;
	bundledMeta: BundledDatabaseMeta | null;
	retry: () => void;
}

export function useNarratorDatabase(): UseNarratorDatabaseReturn {
	const { customNarrators } = useCustomNarrators();

	const priorCache = getCachedNarrators();
	const [bundled, setBundled] = useState<NarratorRecord[]>(priorCache ?? []);
	const [bundledMeta, setBundledMeta] = useState<BundledDatabaseMeta | null>(
		getBundledMeta(),
	);
	const [isLoading, setIsLoading] = useState(priorCache === null);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(() => {
		setIsLoading(true);
		setError(null);
		getNarratorDatabase()
			.then((data) => {
				setBundled(data);
				setBundledMeta(getBundledMeta());
				setIsLoading(false);
			})
			.catch((err: unknown) => {
				_clearNarratorDatabaseCache();
				const msg =
					err instanceof Error ? err.message : "فشل تحميل قاعدة بيانات الرواة";
				setError(msg);
				setIsLoading(false);
			});
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const records = useMemo(
		() => [...bundled, ...customNarrators],
		[bundled, customNarrators],
	);

	return { records, isLoading, error, bundledMeta, retry: load };
}
