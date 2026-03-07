SET ROLE authenticated;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT count(*) FROM document_number_sequences;
RESET "request.jwt.claim.sub";
RESET ROLE;