package jwt

import (
	"context"
	"errors"
	jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	"github.com/auth0/go-jwt-middleware/v2/validator"
)

func UserId(ctx context.Context) (string, error) {
	claims, ok := ctx.Value(jwtmiddleware.ContextKey{}).(*validator.ValidatedClaims)
	if !ok {
		return "", errors.New("could not find claims in context")
	}

	return claims.RegisteredClaims.Subject, nil
}
