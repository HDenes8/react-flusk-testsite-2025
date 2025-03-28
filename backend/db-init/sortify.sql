PGDMP      ;                }            sortify    17.4    17.4 D    s           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            t           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            u           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            v           1262    16388    sortify    DATABASE     m   CREATE DATABASE sortify WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en-GB';
    DROP DATABASE sortify;
                     postgres    false            _           1247    16400    invitation_status_enum    TYPE     e   CREATE TYPE public.invitation_status_enum AS ENUM (
    'pending',
    'accepted',
    'declined'
);
 )   DROP TYPE public.invitation_status_enum;
       public               postgres    false            \           1247    16390 	   role_enum    TYPE     _   CREATE TYPE public.role_enum AS ENUM (
    'reader',
    'editor',
    'admin',
    'owner'
);
    DROP TYPE public.role_enum;
       public               postgres    false            �            1255    16527    get_user_projects(integer)    FUNCTION     �  CREATE FUNCTION public.get_user_projects(user_id_param integer) RETURNS TABLE(project_name text, role text, created_date timestamp without time zone, creator_name text, has_latest boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.name::TEXT AS project_name,
        up.role::TEXT AS role,
        p.created_date::TIMESTAMP WITHOUT TIME ZONE AS created_date,
        COALESCE(u.full_name, 'Unknown')::TEXT AS creator_name,
        NOT EXISTS (
            SELECT 1
            FROM file_version fv
            JOIN file_data fd ON fv.file_id = fd.file_data_id
            LEFT JOIN last_download ld
                ON fv.file_id = ld.file_id AND ld.user_id = up.user_id
            WHERE fd.project_id = p.project_id
            AND (fv.last_version = TRUE OR fv.version_id = (SELECT MAX(version_id) FROM file_version WHERE file_id = fv.file_id))
            AND (ld.version_id IS NULL OR ld.version_id < fv.version_id)
        ) AS has_latest
    FROM user_project up
    JOIN project p ON up.project_id = p.project_id
    LEFT JOIN user_profile u ON p.creator_id = u.user_id
    WHERE up.user_id = user_id_param;
END;
$$;
 ?   DROP FUNCTION public.get_user_projects(user_id_param integer);
       public               postgres    false            �            1259    16502    alembic_version    TABLE     X   CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);
 #   DROP TABLE public.alembic_version;
       public         heap r       postgres    false            �            1259    16470 	   file_data    TABLE     �   CREATE TABLE public.file_data (
    file_data_id integer NOT NULL,
    description text,
    short_comment character varying(20),
    project_id integer
);
    DROP TABLE public.file_data;
       public         heap r       postgres    false            �            1259    16469    file_data_file_data_id_seq    SEQUENCE     �   CREATE SEQUENCE public.file_data_file_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.file_data_file_data_id_seq;
       public               postgres    false    225            w           0    0    file_data_file_data_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.file_data_file_data_id_seq OWNED BY public.file_data.file_data_id;
          public               postgres    false    224            �            1259    16484    file_version    TABLE     q  CREATE TABLE public.file_version (
    version_id integer NOT NULL,
    version_number integer,
    file_name character varying(255),
    file_type character varying(50),
    file_size integer,
    description text,
    last_version boolean,
    short_comment character varying(20),
    upload_date timestamp with time zone,
    file_id integer,
    user_id integer
);
     DROP TABLE public.file_version;
       public         heap r       postgres    false            �            1259    16483    file_version_version_id_seq    SEQUENCE     �   CREATE SEQUENCE public.file_version_version_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.file_version_version_id_seq;
       public               postgres    false    227            x           0    0    file_version_version_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.file_version_version_id_seq OWNED BY public.file_version.version_id;
          public               postgres    false    226            �            1259    16448 
   invitation    TABLE       CREATE TABLE public.invitation (
    invitation_id integer NOT NULL,
    invited_email character varying(255),
    invite_date timestamp with time zone,
    status public.invitation_status_enum,
    invited_user_id integer,
    referrer_id integer,
    project_id integer
);
    DROP TABLE public.invitation;
       public         heap r       postgres    false    863            �            1259    16447    invitation_invitation_id_seq    SEQUENCE     �   CREATE SEQUENCE public.invitation_invitation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public.invitation_invitation_id_seq;
       public               postgres    false    223            y           0    0    invitation_invitation_id_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public.invitation_invitation_id_seq OWNED BY public.invitation.invitation_id;
          public               postgres    false    222            �            1259    16508    last_download    TABLE     �   CREATE TABLE public.last_download (
    last_download_id integer NOT NULL,
    download_date timestamp with time zone,
    file_id integer,
    user_id integer,
    version_id integer
);
 !   DROP TABLE public.last_download;
       public         heap r       postgres    false            �            1259    16507 "   last_download_last_download_id_seq    SEQUENCE     �   CREATE SEQUENCE public.last_download_last_download_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 9   DROP SEQUENCE public.last_download_last_download_id_seq;
       public               postgres    false    230            z           0    0 "   last_download_last_download_id_seq    SEQUENCE OWNED BY     i   ALTER SEQUENCE public.last_download_last_download_id_seq OWNED BY public.last_download.last_download_id;
          public               postgres    false    229            �            1259    16419    project    TABLE     �   CREATE TABLE public.project (
    project_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_date timestamp with time zone,
    project_activity_status boolean,
    creator_id integer
);
    DROP TABLE public.project;
       public         heap r       postgres    false            �            1259    16418    project_project_id_seq    SEQUENCE     �   CREATE SEQUENCE public.project_project_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.project_project_id_seq;
       public               postgres    false    220            {           0    0    project_project_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.project_project_id_seq OWNED BY public.project.project_id;
          public               postgres    false    219            �            1259    16408    user_profile    TABLE     �  CREATE TABLE public.user_profile (
    user_id integer NOT NULL,
    full_name character varying(255),
    nickname character varying(100),
    profile_pic character varying(255),
    email character varying(150),
    password character varying(150),
    mobile character varying(20),
    job character varying(100),
    created_date timestamp with time zone,
    user_activity_status boolean
);
     DROP TABLE public.user_profile;
       public         heap r       postgres    false            �            1259    16407    user_profile_user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.user_profile_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.user_profile_user_id_seq;
       public               postgres    false    218            |           0    0    user_profile_user_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.user_profile_user_id_seq OWNED BY public.user_profile.user_id;
          public               postgres    false    217            �            1259    16432    user_project    TABLE     �   CREATE TABLE public.user_project (
    user_id integer NOT NULL,
    project_id integer NOT NULL,
    role public.role_enum,
    connection_date timestamp with time zone,
    user_deleted_or_left_date timestamp with time zone
);
     DROP TABLE public.user_project;
       public         heap r       postgres    false    860            �           2604    16473    file_data file_data_id    DEFAULT     �   ALTER TABLE ONLY public.file_data ALTER COLUMN file_data_id SET DEFAULT nextval('public.file_data_file_data_id_seq'::regclass);
 E   ALTER TABLE public.file_data ALTER COLUMN file_data_id DROP DEFAULT;
       public               postgres    false    224    225    225            �           2604    16487    file_version version_id    DEFAULT     �   ALTER TABLE ONLY public.file_version ALTER COLUMN version_id SET DEFAULT nextval('public.file_version_version_id_seq'::regclass);
 F   ALTER TABLE public.file_version ALTER COLUMN version_id DROP DEFAULT;
       public               postgres    false    226    227    227            �           2604    16451    invitation invitation_id    DEFAULT     �   ALTER TABLE ONLY public.invitation ALTER COLUMN invitation_id SET DEFAULT nextval('public.invitation_invitation_id_seq'::regclass);
 G   ALTER TABLE public.invitation ALTER COLUMN invitation_id DROP DEFAULT;
       public               postgres    false    222    223    223            �           2604    16511    last_download last_download_id    DEFAULT     �   ALTER TABLE ONLY public.last_download ALTER COLUMN last_download_id SET DEFAULT nextval('public.last_download_last_download_id_seq'::regclass);
 M   ALTER TABLE public.last_download ALTER COLUMN last_download_id DROP DEFAULT;
       public               postgres    false    230    229    230            �           2604    16422    project project_id    DEFAULT     x   ALTER TABLE ONLY public.project ALTER COLUMN project_id SET DEFAULT nextval('public.project_project_id_seq'::regclass);
 A   ALTER TABLE public.project ALTER COLUMN project_id DROP DEFAULT;
       public               postgres    false    220    219    220            �           2604    16411    user_profile user_id    DEFAULT     |   ALTER TABLE ONLY public.user_profile ALTER COLUMN user_id SET DEFAULT nextval('public.user_profile_user_id_seq'::regclass);
 C   ALTER TABLE public.user_profile ALTER COLUMN user_id DROP DEFAULT;
       public               postgres    false    218    217    218            n          0    16502    alembic_version 
   TABLE DATA           6   COPY public.alembic_version (version_num) FROM stdin;
    public               postgres    false    228   �\       k          0    16470 	   file_data 
   TABLE DATA           Y   COPY public.file_data (file_data_id, description, short_comment, project_id) FROM stdin;
    public               postgres    false    225   �\       m          0    16484    file_version 
   TABLE DATA           �   COPY public.file_version (version_id, version_number, file_name, file_type, file_size, description, last_version, short_comment, upload_date, file_id, user_id) FROM stdin;
    public               postgres    false    227   []       i          0    16448 
   invitation 
   TABLE DATA           �   COPY public.invitation (invitation_id, invited_email, invite_date, status, invited_user_id, referrer_id, project_id) FROM stdin;
    public               postgres    false    223   �]       p          0    16508    last_download 
   TABLE DATA           f   COPY public.last_download (last_download_id, download_date, file_id, user_id, version_id) FROM stdin;
    public               postgres    false    230   �^       f          0    16419    project 
   TABLE DATA           s   COPY public.project (project_id, name, description, created_date, project_activity_status, creator_id) FROM stdin;
    public               postgres    false    220   �^       d          0    16408    user_profile 
   TABLE DATA           �   COPY public.user_profile (user_id, full_name, nickname, profile_pic, email, password, mobile, job, created_date, user_activity_status) FROM stdin;
    public               postgres    false    218   �_       g          0    16432    user_project 
   TABLE DATA           m   COPY public.user_project (user_id, project_id, role, connection_date, user_deleted_or_left_date) FROM stdin;
    public               postgres    false    221   c       }           0    0    file_data_file_data_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.file_data_file_data_id_seq', 8, true);
          public               postgres    false    224            ~           0    0    file_version_version_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.file_version_version_id_seq', 10, true);
          public               postgres    false    226                       0    0    invitation_invitation_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.invitation_invitation_id_seq', 11, true);
          public               postgres    false    222            �           0    0 "   last_download_last_download_id_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public.last_download_last_download_id_seq', 8, true);
          public               postgres    false    229            �           0    0    project_project_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.project_project_id_seq', 13, true);
          public               postgres    false    219            �           0    0    user_profile_user_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.user_profile_user_id_seq', 10, true);
          public               postgres    false    217            �           2606    16506 #   alembic_version alembic_version_pkc 
   CONSTRAINT     j   ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);
 M   ALTER TABLE ONLY public.alembic_version DROP CONSTRAINT alembic_version_pkc;
       public                 postgres    false    228            �           2606    16477    file_data file_data_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.file_data
    ADD CONSTRAINT file_data_pkey PRIMARY KEY (file_data_id);
 B   ALTER TABLE ONLY public.file_data DROP CONSTRAINT file_data_pkey;
       public                 postgres    false    225            �           2606    16491    file_version file_version_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.file_version
    ADD CONSTRAINT file_version_pkey PRIMARY KEY (version_id);
 H   ALTER TABLE ONLY public.file_version DROP CONSTRAINT file_version_pkey;
       public                 postgres    false    227            �           2606    16453    invitation invitation_pkey 
   CONSTRAINT     c   ALTER TABLE ONLY public.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (invitation_id);
 D   ALTER TABLE ONLY public.invitation DROP CONSTRAINT invitation_pkey;
       public                 postgres    false    223            �           2606    16513     last_download last_download_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.last_download
    ADD CONSTRAINT last_download_pkey PRIMARY KEY (last_download_id);
 J   ALTER TABLE ONLY public.last_download DROP CONSTRAINT last_download_pkey;
       public                 postgres    false    230            �           2606    16426    project project_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (project_id);
 >   ALTER TABLE ONLY public.project DROP CONSTRAINT project_pkey;
       public                 postgres    false    220            �           2606    16417 #   user_profile user_profile_email_key 
   CONSTRAINT     _   ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_email_key UNIQUE (email);
 M   ALTER TABLE ONLY public.user_profile DROP CONSTRAINT user_profile_email_key;
       public                 postgres    false    218            �           2606    16415    user_profile user_profile_pkey 
   CONSTRAINT     a   ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_pkey PRIMARY KEY (user_id);
 H   ALTER TABLE ONLY public.user_profile DROP CONSTRAINT user_profile_pkey;
       public                 postgres    false    218            �           2606    16436    user_project user_project_pkey 
   CONSTRAINT     m   ALTER TABLE ONLY public.user_project
    ADD CONSTRAINT user_project_pkey PRIMARY KEY (user_id, project_id);
 H   ALTER TABLE ONLY public.user_project DROP CONSTRAINT user_project_pkey;
       public                 postgres    false    221    221            �           2606    16478 #   file_data file_data_project_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.file_data
    ADD CONSTRAINT file_data_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id);
 M   ALTER TABLE ONLY public.file_data DROP CONSTRAINT file_data_project_id_fkey;
       public               postgres    false    225    4793    220            �           2606    16492 &   file_version file_version_file_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.file_version
    ADD CONSTRAINT file_version_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.file_data(file_data_id);
 P   ALTER TABLE ONLY public.file_version DROP CONSTRAINT file_version_file_id_fkey;
       public               postgres    false    225    4799    227            �           2606    16497 &   file_version file_version_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.file_version
    ADD CONSTRAINT file_version_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(user_id);
 P   ALTER TABLE ONLY public.file_version DROP CONSTRAINT file_version_user_id_fkey;
       public               postgres    false    218    4791    227            �           2606    16454 *   invitation invitation_invited_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.invitation
    ADD CONSTRAINT invitation_invited_user_id_fkey FOREIGN KEY (invited_user_id) REFERENCES public.user_profile(user_id);
 T   ALTER TABLE ONLY public.invitation DROP CONSTRAINT invitation_invited_user_id_fkey;
       public               postgres    false    4791    218    223            �           2606    16464 %   invitation invitation_project_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.invitation
    ADD CONSTRAINT invitation_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id);
 O   ALTER TABLE ONLY public.invitation DROP CONSTRAINT invitation_project_id_fkey;
       public               postgres    false    223    4793    220            �           2606    16459 &   invitation invitation_referrer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.invitation
    ADD CONSTRAINT invitation_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.user_profile(user_id);
 P   ALTER TABLE ONLY public.invitation DROP CONSTRAINT invitation_referrer_id_fkey;
       public               postgres    false    4791    218    223            �           2606    16514 (   last_download last_download_file_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.last_download
    ADD CONSTRAINT last_download_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.file_data(file_data_id);
 R   ALTER TABLE ONLY public.last_download DROP CONSTRAINT last_download_file_id_fkey;
       public               postgres    false    225    4799    230            �           2606    16519 (   last_download last_download_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.last_download
    ADD CONSTRAINT last_download_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(user_id);
 R   ALTER TABLE ONLY public.last_download DROP CONSTRAINT last_download_user_id_fkey;
       public               postgres    false    230    4791    218            �           2606    16534 +   last_download last_download_version_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.last_download
    ADD CONSTRAINT last_download_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.file_version(version_id);
 U   ALTER TABLE ONLY public.last_download DROP CONSTRAINT last_download_version_id_fkey;
       public               postgres    false    230    227    4801            �           2606    16427    project project_creator_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.user_profile(user_id);
 I   ALTER TABLE ONLY public.project DROP CONSTRAINT project_creator_id_fkey;
       public               postgres    false    220    218    4791            �           2606    16442 )   user_project user_project_project_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_project
    ADD CONSTRAINT user_project_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id);
 S   ALTER TABLE ONLY public.user_project DROP CONSTRAINT user_project_project_id_fkey;
       public               postgres    false    221    220    4793            �           2606    16437 &   user_project user_project_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_project
    ADD CONSTRAINT user_project_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(user_id);
 P   ALTER TABLE ONLY public.user_project DROP CONSTRAINT user_project_user_id_fkey;
       public               postgres    false    4791    221    218            n      x�37M5�L34I47������ )=�      k   P   x�3�t�,*.QH��IU��S(��JM.Qp����,�L�Q(-��OL�4�2�NM��K!F�9c�Е�rY�2��=... ��9�      m   k   x�U��
� ��|ن�<�������D��Bقm���!0���8/�d[�
}	�!�J?m��@�P(rϫr�q��_�vSsa�}�щv�9}�_��k�K�s��3/      i   �   x���M
�0����)�%36�fՃt� ������Ң`��~�?-���ԝob�X�NU��I�]Ύ�M��WM_��H�����~���(~�k�C�q�
�&��f��e,��;�$Ħ�D��5��ڄ�:ձ�.�UR��`�u��������Ŧ�"��+k�      p   A   x��ʹ�0��W9c�$8=����@x6]�gj]�n�6��d�l?,��Ê^�o���      f     x�m�;N1 ��>��(�|��3P�dY�䠀�MAn���N6�C���c�zy=�V���06H�(�-��AYm���{����rY+N�Yl@��r�M��e�l��Ι��Y�r���ψ�e@EC�hÄ���5��ւ���Dt0��tX�5lA"6D�M"���퐛�>j�w�$�F$Fa��q+Cɪ�JY�\V��bē��5���w�*d�v�d�A� < ���WS��!��>�ebV��o���[����b���y�������      d   �  x���KnG�ףSw��ꪮ~�*`D)�M�����W)�eR6���9�/�Q	,Y 3���E�_��m��o�\$�v��zu���r���(]/�u\d�v�w@6���g����'3}�Z��!����8Sq!�](Z�+P{�TQ��Fgc��ࠌX����E@~�J�����18r�gP��@7�=�`ҕE3�.����rQ���q�~{�Ɠ��j����b(I�\"��<�L�Љ��lϜš�@�n(�bz)>�������U�<�q��ͺ�<|�3��6����s7q~���毇L�d�KV�f��n�Mm"aҖ�<��.k� �U��c,ZM/@�~sjd�9cwЦ��뿫��l���t���O���+��~�fz��9{1)�FĨ�h-�p ��٠�m�Vj�-M�SHϸJ�@�r;`ۄ��-B������|1�_��5ܖͻ��n=�!T)�7�MB�c��K6��AY4�l%S--��)$���o	v�n7t�[������?��N�.6��n�j|�ZB�6(H%��\��v�T?;�D��T6���L
(&���{��n��C�n0�V��X>5�˴��e����jY�ª��XN�O�Σ�KVW���ۡ'�uQ"�R%�@CD�Va&��;f֎�BSl�VG+H���hzuC���m{���1���^���
���DW����ly��I
��|5O��u����%X�dݯ�1��@�>z�������P�ɝ������o����      g   �   x�}�;�0�9=;j�G�$>'`A��.\�h����?�������~�́�d�쐌Ȁ&����������Q�X��5��V�L]���}�L%�ji���m�g瘍^ǏϤN���Z3��!�֟L��Q��0_N�^�i�ZI���v�V�C-�N�Q���b��T1�JQ�s�T�Q�!�2�0U�;%%K��4�>y��     