CREATE TABLE IF NOT EXISTS public.flashes
(
    flash_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    user_id integer NOT NULL,
    entry_date timestamp with time zone DEFAULT now(),
    user_com text COLLATE pg_catalog."default",
    collection_id integer,
    geom geometry(Point,4326),
    CONSTRAINT flashes_pkey PRIMARY KEY (flash_id),
    CONSTRAINT fk_collection FOREIGN KEY (collection_id)
        REFERENCES public.collections (collection_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT flashes_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.flashes
    OWNER to postgres;