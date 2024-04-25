package store

import "context"

func Stores(userId string, stores ...Store) func() {
	return func() {
		ctx := context.Background()
		for _, store := range stores {
			_, _ = store.DeleteAll(ctx, userId)
		}
	}
}
