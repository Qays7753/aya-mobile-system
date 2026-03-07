SET ROLE authenticated;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT count(*) FROM document_number_sequences;
RESET "request.jwt.claim.sub";
RESET ROLE;